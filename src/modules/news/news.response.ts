import { News } from "src/db/entity/news.entity";
import { NewsQuery } from "./news.dto";

const newsData = (news: News) => {
    return {
        id: news.id,
        type: "news",
        attributes: {
            name: news.name,
            text: news.text,
            company_id: news.companyId,
            created_at: news.createdAt,
            updated_at: news.updatedAt
        }
    };
};

export const newsResponse = (news: News) => {
    return {
        data: newsData(news)
    };
};

export const paginatedNews = (
    newsList: News[],
    query: NewsQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const extraParams = query.company_id ? `&company_id=${query.company_id}` : "";
    const textParam = query.text
        ? `&text=${encodeURIComponent(query.text)}`
        : "";
    const pageParams = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}${extraParams}${textParam}`;
    return {
        data: newsList.map(newsData),
        links: {
            self: pageParams(offset),
            first: pageParams(0),
            last: pageParams(lastPage * limit),
            prev:
                currentPage > 0 ? pageParams((currentPage - 1) * limit) : null,
            next:
                currentPage < lastPage
                    ? pageParams((currentPage + 1) * limit)
                    : null
        }
    };
};
