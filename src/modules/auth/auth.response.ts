import { Account } from "src/db/entity/account.entity";

export const authResponse = (account: Account) => {
    return {
        data: {
            id: account.id,
            type: "account",
            attributes: {
                role: account.role,
                email: account.email,
                updatedAt: account.updatedAt,
                createdAt: account.createdAt
            },
            relationships: {
                profile: {
                    data: {
                        id: account.id,
                        type: "profile"
                    }
                }
            }
        }
    };
};
