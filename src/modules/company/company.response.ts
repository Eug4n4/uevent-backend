import { Company } from "src/db/entity/company.entity";

export const companyResponse = (company: Company) => {
    return {
        data: {
            id: company.id,
            type: "company",
            attributes: {
                name: company.name,
                email: company.email,
                address: company.address,
                avatar: company.avatar,
                banner: company.banner
            }
        }
    };
};
