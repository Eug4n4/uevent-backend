import { Company } from "src/db/entity/company.entity";
import { Profile } from "src/db/entity/profile.entity";
import { CompanyQuery, PageQuery } from "./company.dto";

const companyData = (company: Company) => {
    return {
        id: company.id,
        type: "company",
        attributes: {
            name: company.name,
            email: company.email,
            address: company.address,
            avatar: company.avatar,
            banner: company.banner
        }
    };
};

export const companyResponse = (company: Company) => {
    return {
        data: companyData(company)
    };
};

export const collectionCompaniesResponse = (companies: Company[]) => ({
    data: companies.map(companyData)
});

const buildLinks = (
    baseUrl: string,
    offset: number,
    limit: number,
    total: number
) => {
    const currentPage = Math.floor(offset / limit);
    const lastPage = Math.max(0, Math.floor((total - 1) / limit));
    const url = (o: number) =>
        `${baseUrl}?page[limit]=${limit}&page[offset]=${o}`;
    return {
        self: url(offset),
        first: url(0),
        last: url(lastPage * limit),
        prev: currentPage > 0 ? url((currentPage - 1) * limit) : null,
        next: currentPage < lastPage ? url((currentPage + 1) * limit) : null
    };
};

const subscriberData = (profile: Profile) => ({
    id: profile.accountId,
    type: "profile",
    attributes: { username: profile.username, avatar: profile.avatar }
});

export const paginatedSubscribers = (
    profiles: Profile[],
    query: PageQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    return {
        data: profiles.map(subscriberData),
        links: buildLinks(baseUrl, offset, limit, total)
    };
};

export const paginatedSubscriptions = (
    companies: Company[],
    query: PageQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    return {
        data: companies.map(companyData),
        links: buildLinks(baseUrl, offset, limit, total)
    };
};

export const paginatedCompanies = (
    companies: Company[],
    query: CompanyQuery,
    total: number,
    baseUrl: string
) => {
    const offset = Number(query["page[offset]"]);
    const limit = Number(query["page[limit]"]);
    const nameParam = query.name ? `&name=${query.name}` : "";
    const links = buildLinks(baseUrl, offset, limit, total);
    if (nameParam) {
        Object.keys(links).forEach((key) => {
            if (links[key]) links[key] += nameParam;
        });
    }
    return { data: companies.map(companyData), links };
};
