import { Injectable, NotFoundException } from "@nestjs/common";
import { NewsCreateDetails, NewsQuery, NewsUpdateAttributes } from "./news.dto";
import { News } from "src/db/entity/news.entity";
import { database } from "src/db/data-source";
import { ILike } from "typeorm";
import { CompanyService } from "../company/company.service";
import { CompanyMemberRole } from "src/db/entity/company.entity";
import { MailService } from "../mail/mail.service";

@Injectable()
export class NewsService {
    constructor(
        private companyService: CompanyService,
        private mail: MailService
    ) {}

    async getAll(query: NewsQuery, includes: Set<string> = new Set()): Promise<[News[], number]> {
        const where: Record<string, unknown> = {};
        if (query.company_id) {
            where.companyId = query.company_id;
        }
        const relations = includes.has("companies") ? { company: true } : undefined;

        if (query.text) {
            return database.dataSource.manager.findAndCount(News, {
                where: [
                    { ...where, name: ILike(`%${query.text}%`) },
                    { ...where, text: ILike(`%${query.text}%`) }
                ],
                relations,
                order: { createdAt: "DESC" },
                take: query["page[limit]"],
                skip: query["page[offset]"]
            });
        }

        return database.dataSource.manager.findAndCount(News, {
            where,
            relations,
            order: { createdAt: "DESC" },
            take: query["page[limit]"],
            skip: query["page[offset]"]
        });
    }

    async getById(id: string, includes: Set<string> = new Set()) {
        const news = await News.findOne({
            where: { id },
            relations: includes.has("companies") ? { company: true } : undefined
        });
        if (!news) {
            throw new NotFoundException(`Can't find news with id = ${id}`);
        }
        return news;
    }

    async create(dto: NewsCreateDetails, userId: string) {
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
        void this.mail.companyNewPublished(news.id);
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
