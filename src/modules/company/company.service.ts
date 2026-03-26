import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import {
    BillingAttributes,
    CompanyAttributes,
    CompanyQuery,
    CompanyUpdateAttributes,
    PageQuery
} from "./company.dto";
import { Company } from "src/db/entity/company.entity";
import { CompanyMember, CompanyMemberRole, CompanySub } from "src/db/entity/company.entity";
import { Profile } from "src/db/entity/profile.entity";
import { Account } from "src/db/entity/account.entity";
import { ILike, In } from "typeorm";
import { database } from "src/db/data-source";
import { S3Service } from "../shared/s3.uploader";
import { CompanyBilling } from "src/db/entity/company.entity";

@Injectable()
export class CompanyService {
    constructor(private s3Service: S3Service) {}

    /**
     * Creates a new company and automatically makes the creator its OWNER.
     *
     * Both the Company row and the initial CompanyMember (role=OWNER) row are
     * inserted in a single DB transaction so there is never a company without an owner.
     * Throws 409 if another company already uses the given e-mail.
     */
    async create(dto: CompanyAttributes, accountId: string) {
        // Verify the account exists before creating a company for it
        const account = await Account.findOneBy({ id: accountId });
        if (!account) {
            throw new BadRequestException(
                "Can't create company for this account"
            );
        }
        const existing = await Company.findOneBy({ email: dto.email });
        if (existing !== null) {
            throw new ConflictException(
                "Company with this email already exists"
            );
        }

        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const company = queryRunner.manager.create(Company, { ...dto });
            await queryRunner.manager.save(company);

            // The creator becomes the first (and sole) OWNER automatically
            const member = queryRunner.manager.create(CompanyMember, {
                accountId,
                companyId: company.id,
                role: CompanyMemberRole.OWNER
            });
            await queryRunner.manager.save(member);

            await queryRunner.commitTransaction();
            return company;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Retrieves a single company by its UUID.  Throws 404 if not found.
     */
    async getById(id: string) {
        const company = await Company.findOneBy({ id });
        if (!company) {
            throw new NotFoundException("Company not found");
        }
        return company;
    }

    /**
     * Returns a paginated, optionally filtered list of companies.
     *
     * When `query.me` is true the result is limited to companies where the caller
     * is a member (used for "my companies" view).
     * When `query.name` is provided the results are filtered by a case-insensitive
     * LIKE match on the company name.
     */
    async getAll(
        query: CompanyQuery,
        accountId?: string
    ): Promise<[Company[], number]> {
        if (query.me && accountId) {
            // Resolve the set of companies the user belongs to first
            const members = await CompanyMember.findBy({ accountId });
            if (members.length === 0) return [[], 0];
            const ids = members.map((m) => m.companyId);
            return database.dataSource.manager.findAndCount(Company, {
                where: {
                    id: In(ids),
                    ...(query.name ? { name: ILike(`%${query.name}%`) } : {})
                },
                order: { name: "ASC" },
                take: query["page[limit]"],
                skip: query["page[offset]"]
            });
        }
        // Global listing with optional name filter
        return database.dataSource.manager.findAndCount(Company, {
            where: query.name ? { name: ILike(`%${query.name}%`) } : {},
            order: { name: "ASC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });
    }

    /**
     * Uploads a new avatar image to S3 for the company, replacing any existing one.
     * The old S3 object is deleted to avoid orphaned files.
     * Authorization: caller must be the company OWNER.
     */
    async uploadAvatar(
        companyId: string,
        accountId: string,
        file: Express.Multer.File
    ) {
        const company = await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        // Delete the existing avatar from S3 before uploading the new one
        if (company.avatarKey) {
            await this.s3Service.deleteObject(company.avatarKey);
        }
        const avatarKey = `company/${companyId}/avatar_${Date.now()}`;
        await this.s3Service.putObject(file.buffer, file.mimetype, avatarKey);
        company.avatarKey = avatarKey;
        await company.save();
        return company;
    }

    /**
     * Uploads a new banner image to S3 for the company, replacing any existing one.
     * Authorization: caller must be the company OWNER.
     */
    async uploadBanner(
        companyId: string,
        accountId: string,
        file: Express.Multer.File
    ) {
        const company = await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        if (company.bannerKey) {
            await this.s3Service.deleteObject(company.bannerKey);
        }
        const bannerKey = `company/${companyId}/banner_${Date.now()}`;
        await this.s3Service.putObject(file.buffer, file.mimetype, bannerKey);
        company.bannerKey = bannerKey;
        await company.save();
        return company;
    }

    /**
     * Updates mutable company fields (name, description, website, etc.).
     * Only fields that are explicitly provided in the DTO are changed (partial update).
     * Authorization: caller must be the company OWNER.
     */
    async update(
        companyId: string,
        accountId: string,
        dto: CompanyUpdateAttributes
    ) {
        const company = await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        // Apply only non-undefined fields
        Object.assign(
            company,
            Object.fromEntries(
                Object.entries(dto).filter(([, v]) => v !== undefined)
            )
        );
        await company.save();
        return company;
    }

    /**
     * Soft-deletes a company and all its member records.
     * TypeORM's soft-delete sets `deleted_at` so the rows remain in the DB for
     * audit purposes but are excluded from all standard queries.
     * Authorization: caller must be the company OWNER.
     */
    async delete(companyId: string, accountId: string) {
        const company = await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        // Soft-delete all member records before soft-deleting the company itself
        await database.dataSource.manager.softDelete(CompanyMember, {
            companyId
        });
        await company.softRemove();
    }

    /**
     * Subscribes the caller to a company (follow/notification opt-in).
     * Throws 400 if already subscribed.
     */
    async subscribe(companyId: string, accountId: string) {
        await this.getById(companyId); // ensure company exists
        const existing = await CompanySub.findOneBy({ companyId, accountId });
        if (existing) {
            throw new BadRequestException("Already subscribed to this company");
        }
        const sub = CompanySub.create({ companyId, accountId });
        await sub.save();
    }

    /**
     * Removes the caller's subscription to a company.
     * Throws 404 if no subscription exists.
     */
    async unsubscribe(companyId: string, accountId: string) {
        await this.getById(companyId);
        const sub = await CompanySub.findOneBy({ companyId, accountId });
        if (!sub) {
            throw new NotFoundException("Subscription not found");
        }
        await sub.remove();
    }

    /**
     * Returns a paginated list of accounts (as Profiles) subscribed to a company.
     * The query joins CompanySub → Profile to avoid loading full Account objects.
     */
    async getSubscribers(
        companyId: string,
        query: PageQuery
    ): Promise<[Profile[], number]> {
        await this.getById(companyId);
        // First page the sub records, then resolve profiles from the account IDs
        const [subs, total] = await database.dataSource.manager.findAndCount(
            CompanySub,
            {
                where: { companyId },
                take: query["page[limit]"],
                skip: query["page[offset]"]
            }
        );
        if (subs.length === 0) return [[], total];
        const profiles = await Profile.findBy({
            accountId: In(subs.map((s) => s.accountId))
        });
        return [profiles, total];
    }

    /**
     * Returns a paginated list of companies the caller is subscribed to.
     */
    async getSubscriptions(
        accountId: string,
        query: PageQuery
    ): Promise<[Company[], number]> {
        const [subs, total] = await database.dataSource.manager.findAndCount(
            CompanySub,
            {
                where: { accountId },
                take: query["page[limit]"],
                skip: query["page[offset]"]
            }
        );
        if (subs.length === 0) return [[], total];
        const companies = await Company.findBy({
            id: In(subs.map((s) => s.companyId))
        });
        return [companies, total];
    }

    // ──────────────────────────────
    // Billing (Stripe Connect)
    // ──────────────────────────────

    async createBilling(
        companyId: string,
        accountId: string,
        dto: BillingAttributes
    ) {
        await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        const existing = await CompanyBilling.findOneBy({ companyId });
        if (existing) {
            throw new ConflictException(
                "Billing record already exists for this company"
            );
        }
        const billing = CompanyBilling.create({
            companyId,
            stripeAccountId: dto.stripe_account_id
        });
        await billing.save();
        return billing;
    }

    async getBilling(companyId: string, accountId: string) {
        await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        const billing = await CompanyBilling.findOneBy({ companyId });
        if (!billing) {
            throw new NotFoundException("Billing record not found");
        }
        return billing;
    }

    // ──────────────────────────────
    // Guards / helpers
    // ──────────────────────────────

    /**
     * Throws 403 if the caller does not hold one of the required roles in the company.
     * Exposed publicly so other services (EventService, PaymentService) can reuse it.
     */
    async requireCompanyRole(
        companyId: string,
        accountId: string,
        roles: CompanyMemberRole[]
    ): Promise<void> {
        const member = await CompanyMember.findOne({
            where: { companyId, accountId, role: In(roles) }
        });
        if (!member) {
            throw new ForbiddenException(
                "You don't have required permissions for this company"
            );
        }
    }
}
