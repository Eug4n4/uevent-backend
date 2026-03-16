import { Company } from "src/db/entity/company.entity";

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

export const manyCompaniesResponse = (companies: Company[]) => {
    const arr: ReturnType<typeof companyData>[] = [];
    for (const company of companies) {
        arr.push(companyData(company));
    }
    return {
        data: arr
    };
};
