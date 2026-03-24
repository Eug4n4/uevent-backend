import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import {
    CompanyAttributes,
    CompanyQuery,
    CompanyUpdateAttributes,
    PageQuery
} from "./company.dto";
import { Company } from "src/db/entity/company.entity";
import {
    CompanyMember,
    CompanyMemberRole
} from "src/db/entity/company_member.entity";
import { CompanySub } from "src/db/entity/company_subs.entity";
import { Profile } from "src/db/entity/profile.entity";
import { Account } from "src/db/entity/account.entity";
import { ILike, In } from "typeorm";
import { database } from "src/db/data-source";
import { S3Service } from "../shared/s3.uploader";

@Injectable()
export class CompanyService {
    constructor(private s3Service: S3Service) {}

    async create(dto: CompanyAttributes, accountId: string) {
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

    async getById(id: string) {
        const company = await Company.findOneBy({ id });
        if (!company) {
            throw new NotFoundException("Company not found");
        }
        return company;
    }

    async getAll(
        query: CompanyQuery,
        accountId?: string
    ): Promise<[Company[], number]> {
        if (query.me && accountId) {
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
        return database.dataSource.manager.findAndCount(Company, {
            where: query.name ? { name: ILike(`%${query.name}%`) } : {},
            order: { name: "ASC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });
    }

    async uploadAvatar(
        companyId: string,
        accountId: string,
        file: Express.Multer.File
    ) {
        const company = await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        if (company.avatarKey) {
            await this.s3Service.deleteObject(company.avatarKey);
        }
        const avatarKey = `company/${companyId}/avatar_${Date.now()}`;
        await this.s3Service.putObject(file.buffer, file.mimetype, avatarKey);
        company.avatarKey = avatarKey;
        await company.save();
        return company;
    }

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

    async update(
        companyId: string,
        accountId: string,
        dto: CompanyUpdateAttributes
    ) {
        const company = await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        Object.assign(
            company,
            Object.fromEntries(
                Object.entries(dto).filter(([, v]) => v !== undefined)
            )
        );
        await company.save();
        return company;
    }

    async delete(companyId: string, accountId: string) {
        const company = await this.getById(companyId);
        await this.requireCompanyRole(companyId, accountId, [
            CompanyMemberRole.OWNER
        ]);
        await database.dataSource.manager.softDelete(CompanyMember, {
            companyId
        });
        await company.softRemove();
    }

    async subscribe(companyId: string, accountId: string) {
        await this.getById(companyId);
        const existing = await CompanySub.findOneBy({ companyId, accountId });
        if (existing) {
            throw new BadRequestException("Already subscribed to this company");
        }
        const sub = CompanySub.create({ companyId, accountId });
        await sub.save();
    }

    async unsubscribe(companyId: string, accountId: string) {
        await this.getById(companyId);
        const sub = await CompanySub.findOneBy({ companyId, accountId });
        if (!sub) {
            throw new NotFoundException("Subscription not found");
        }
        await sub.remove();
    }

    async getSubscribers(
        companyId: string,
        query: PageQuery
    ): Promise<[Profile[], number]> {
        await this.getById(companyId);
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
