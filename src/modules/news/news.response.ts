import { News } from "src/db/entity/news.entity";
import { NewsQuery } from "./news.dto";
import { buildFileUrl, stripNulls } from "../shared/s3.uploader";
import { Company } from "src/db/entity/company.entity";

const newsData = (news: News) => ({
    id: news.id,
    type: "news",
    attributes: {
        name: news.name,
        text: news.text,
        created_at: news.createdAt,
        updated_at: news.updatedAt
    },
    relationships: {
        company: {
            data: { id: news.companyId, type: "company" }
        }
    }
});

const formatCompany = (company: Company) => ({
    id: company.id,
    type: "company",
    attributes: stripNulls({
        name: company.name,
        email: company.email,
        address: company.address,
        avatar_url: buildFileUrl(company.avatarKey),
        banner_url: buildFileUrl(company.bannerKey)
    })
});

const buildIncluded = (newsList: News[], includes: Set<string>) => {
    if (!includes.has("companies")) return undefined;
    const seen = new Map<string, Company>();
    for (const news of newsList) {
        if (news.company && !seen.has(news.company.id)) {
            seen.set(news.company.id, news.company);
        }
    }
    const result = [...seen.values()].map(formatCompany);
    return result.length > 0 ? result : undefined;
};

export const newsResponse = (news: News, includes: Set<string> = new Set()) => {
    const included = buildIncluded([news], includes);
    return stripNulls({ data: newsData(news), included });
};

export const paginatedNews = (
    newsList: News[],
    query: NewsQuery,
    total: number,
    baseUrl: string,
    includes: Set<string> = new Set()
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const extraParams = query.company_id ? `&company_id=${query.company_id}` : "";
    const textParam = query.text ? `&text=${encodeURIComponent(query.text)}` : "";
    const pageParams = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}${extraParams}${textParam}`;
    const included = buildIncluded(newsList, includes);
    return stripNulls({
        data: newsList.map(newsData),
        included,
        links: stripNulls({
            self: pageParams(offset),
            first: pageParams(0),
            last: pageParams(lastPage * limit),
            prev: currentPage > 0 ? pageParams((currentPage - 1) * limit) : null,
            next: currentPage < lastPage ? pageParams((currentPage + 1) * limit) : null
        })
    });
};
