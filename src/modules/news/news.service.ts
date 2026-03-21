import {
    ForbiddenException,
    Injectable,
    NotFoundException
} from "@nestjs/common";
import { NewsAttributes, NewsQuery, NewsUpdateAttributes } from "./news.dto";
import { News } from "src/db/entity/news.entity";
import { Company } from "src/db/entity/company.entity";
import { database } from "src/db/data-source";
import { ILike } from "typeorm";

@Injectable()
export class NewsService {
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
        const company = await Company.findOneBy({ id: dto.company_id });
        if (!company) {
            throw new NotFoundException("Company not found");
        }
        if (company.ownerId !== userId) {
            throw new ForbiddenException("Only company owner can create news");
        }
        const news = News.create({ name: dto.name, text: dto.text, companyId: dto.company_id });
        await news.save();
        return news;
    }

    async update(id: string, dto: NewsUpdateAttributes, userId: string) {
        const news = await this.getById(id);
        const company = await Company.findOneBy({ id: news.companyId });
        if (!company || company.ownerId !== userId) {
            throw new ForbiddenException("Only company owner can update news");
        }
        Object.assign(news, dto);
        await news.save();
        return news;
    }

    async remove(id: string, userId: string) {
        const news = await this.getById(id);
        const company = await Company.findOneBy({ id: news.companyId });
        if (!company || company.ownerId !== userId) {
            throw new ForbiddenException("Only company owner can delete news");
        }
        await news.remove();
    }
}
