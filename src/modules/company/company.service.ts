import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import {
    CompanyAttributes,
    CompanyQuery,
    CompanyUpdateAttributes
} from "./company.dto";
import { Company } from "src/db/entity/company.entity";
import { Account } from "src/db/entity/account.entity";
import { DataSource, ILike } from "typeorm";
import { S3Service } from "../shared/s3.uploader";

@Injectable()
export class CompanyService {
    constructor(
        private dataSource: DataSource,
        private s3Service: S3Service
    ) {}

    async getAll(query: CompanyQuery): Promise<[Company[], number]> {
        return this.dataSource.manager.findAndCount(Company, {
            where: query.name ? { name: ILike(`%${query.name}%`) } : {},
            order: { name: "ASC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });
    }

    async findById(id: string) {
        const company = await Company.findOneBy({ id });
        if (!company) {
            throw new NotFoundException("Company not found");
        }
        return company;
    }

    async findByOwnerId(ownerId: string): Promise<Company[]> {
        return Company.findBy({ ownerId });
    }

    async create(dto: CompanyAttributes, ownerId: string) {
        const account = await Account.findOneBy({ id: ownerId });
        const existing = await Company.findOneBy({ email: dto.email });
        if (!account) {
            throw new BadRequestException(
                "Can't create company for this account"
            );
        }
        if (existing !== null) {
            throw new BadRequestException(
                "Company with this email already exists"
            );
        }
        const company = Company.create({ ...dto, ownerId });
        await company.save();
        return company;
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

    async update(
        companyId: string,
        ownerId: string,
        dto: CompanyUpdateAttributes
    ) {
        const company = await this.findById(companyId);
        if (!this.isCompanyOwner(company, ownerId)) {
            throw new ForbiddenException("You are not the company owner");
        }
        if (dto.email && dto.email !== company.email) {
            const existing = await Company.findOneBy({ email: dto.email });
            if (existing) {
                throw new BadRequestException(
                    "Company with this email already exists"
                );
            }
        }
        Object.assign(company, dto);
        await company.save();
        return company;
    }

    async remove(companyId: string, ownerId: string) {
        const company = await this.findById(companyId);
        if (!this.isCompanyOwner(company, ownerId)) {
            throw new ForbiddenException("You are not the company owner");
        }
        await company.softRemove();
    }

    isCompanyOwner(company: Company, ownerId: string) {
        return company.ownerId === ownerId;
    }
}
