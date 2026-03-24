import { Injectable, NotFoundException } from "@nestjs/common";
import { NewsAttributes, NewsQuery, NewsUpdateAttributes } from "./news.dto";
import { News } from "src/db/entity/news.entity";
import { database } from "src/db/data-source";
import { ILike } from "typeorm";
import { CompanyService } from "../company/company.service";
import { CompanyMemberRole } from "src/db/entity/company_member.entity";

@Injectable()
export class NewsService {
    constructor(private companyService: CompanyService) {}

    async getAll(query: NewsQuery): Promise<[News[], number]> {
        const where: Record<string, unknown> = {};
        if (query.company_id) {
            where.companyId = query.company_id;
        }

        if (query.text) {
            return database.dataSource.manager.findAndCount(News, {
                where: [
                    { ...where, name: ILike(`%${query.text}%`) },
                    { ...where, text: ILike(`%${query.text}%`) }
                ],
                order: { createdAt: "DESC" },
                take: query["page[limit]"],
                skip: query["page[offset]"]
            });
        }

        return database.dataSource.manager.findAndCount(News, {
            where,
            order: { createdAt: "DESC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });
    }

    async getById(id: string) {
        const news = await News.findOneBy({ id });
        if (!news) {
            throw new NotFoundException(`Can't find news with id = ${id}`);
        }
        return news;
    }

    async create(dto: NewsAttributes, userId: string) {
        await this.companyService.getById(dto.company_id);
        await this.companyService.requireCompanyRole(dto.company_id, userId, [
            CompanyMemberRole.OWNER
        ]);
        const news = News.create({
            name: dto.name,
            text: dto.text,
            companyId: dto.company_id
        });
        await news.save();
        return news;
    }

    async update(id: string, dto: NewsUpdateAttributes, userId: string) {
        const news = await this.getById(id);
        await this.companyService.requireCompanyRole(news.companyId, userId, [
            CompanyMemberRole.OWNER
        ]);
        Object.assign(
            news,
            Object.fromEntries(
                Object.entries(dto).filter(([, v]) => v !== undefined)
            )
        );
        await news.save();
        return news;
    }

    async remove(id: string, userId: string) {
        const news = await this.getById(id);
        await this.companyService.requireCompanyRole(news.companyId, userId, [
            CompanyMemberRole.OWNER
        ]);
        await news.remove();
    }
}
