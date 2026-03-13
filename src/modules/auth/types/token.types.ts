export type AccessTokenPayload = {
    sub: string;
    role: string;
};

export type RefreshTokenPayload = {
    sub: string;
};

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
