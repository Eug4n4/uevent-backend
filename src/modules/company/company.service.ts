import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { CompanyAttributes } from "./company.dto";
import { DataSource } from "typeorm";
import { Company } from "src/db/entity/company.entity";
import { Account } from "src/db/entity/account.entity";
import { CompanyMember } from "src/db/entity/company.member.entity";
import { S3Service } from "../shared/s3.uploader";

@Injectable()
export class CompanyService {
    constructor(
        private dataSource: DataSource,
        private s3Service: S3Service
    ) {}

    async findById(id: string) {
        const company = await Company.findOne({
            where: { id },
            relations: { companyMembers: true }
        });
        if (!company) {
            throw new NotFoundException("Company not found");
        }
        return company;
    }

    async create(dto: CompanyAttributes, ownerId: string) {
        const account = await Account.findOneBy({ id: ownerId });
        let company = await Company.findOneBy({ email: dto.email });
        if (!account) {
            throw new BadRequestException(
                "Can't create company for this account"
            );
        }
        if (company !== null) {
            throw new BadRequestException(
                "Company with this email already exists"
            );
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            company = queryRunner.manager.create(Company, { ...dto });
            await queryRunner.manager.save(company);
            await queryRunner.manager.save(CompanyMember, {
                company,
                member: account,
                isOwner: true
            });
            await queryRunner.commitTransaction();
            return company;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async uploadAvatar(
        companyId: string,
        ownerId: string,
        file: Express.Multer.File
    ) {
        const company = await this.findById(companyId);
        if (!this.isCompanyOwner(company, ownerId)) {
            throw new ForbiddenException(
                "Can't upload avatar. You are not an owner"
            );
        }
        if (company.avatar !== "default.png") {
            const key = this.s3Service.getKeyFromUrl(company.avatar);
            if (key) {
                await this.s3Service.deleteObject(key);
            }
        }
        const { url } = await this.s3Service.putObject(
            file.buffer,
            file.mimetype,
            `company/${companyId}/avatar_${Date.now()}`
        );
        company.avatar = url;
        await company.save();
        return company;
    }

    async uploadBanner(
        companyId: string,
        ownerId: string,
        file: Express.Multer.File
    ) {
        const company = await this.findById(companyId);
        if (!this.isCompanyOwner(company, ownerId)) {
            throw new ForbiddenException(
                "Can't upload banner. You are not an owner"
            );
        }
        if (company.banner !== "default.png") {
            const key = this.s3Service.getKeyFromUrl(company.banner);
            if (key) {
                await this.s3Service.deleteObject(key);
            }
        }
        const { url } = await this.s3Service.putObject(
            file.buffer,
            file.mimetype,
            `company/${companyId}/banner_${Date.now()}`
        );
        company.banner = url;
        await company.save();
        return company;
    }

    private isCompanyOwner(company: Company, ownerId: string) {
        return company.companyMembers.some(
            (member) => member.accountId === ownerId && member.isOwner
        );
    }
}
