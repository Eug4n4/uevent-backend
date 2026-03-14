export type TokenPair = {
    access: {
        token: string;
        expires: number;
    };
    refresh: {
        token: string;
        expires: number;
    };
};
