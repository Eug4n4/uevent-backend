import { BadRequestException, Injectable } from "@nestjs/common";
import { CompanyAttributes } from "./company.dto";
import { DataSource } from "typeorm";
import { Company } from "src/db/entity/company.entity";
import { Account } from "src/db/entity/account.entity";
import { CompanyMember } from "src/db/entity/company.member.entity";

@Injectable()
export class CompanyService {
    constructor(private dataSource: DataSource) {}

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
}
