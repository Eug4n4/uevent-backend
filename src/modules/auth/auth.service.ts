import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DataSource } from "typeorm";
import { RegisterDto, LoginDto } from "./auth.dto";
import type { TokenPair } from "./auth.types";
import { Account } from "src/db/entity/account.entity";
import { Profile } from "src/db/entity/profile.entity";
import { Hasher } from "./hasher";
import { RefreshTokenPayload } from "../shared/jwt.strategy";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private dataSource: DataSource
    ) {}

    public async register(dto: RegisterDto) {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const hashResult = await Hasher.hash(dto.data.attributes.password);
            const account = queryRunner.manager.create(Account, {
                ...dto.data.attributes,
                password: `${hashResult.salt}$${hashResult.hash}$${hashResult.keylen}`
            });
            await account.save();
            const profile = queryRunner.manager.create(Profile, {
                ...dto.data.attributes,
                account: account
            });
            await profile.save();
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    public async login(dto: LoginDto) {
        const account = await this.validateUser(dto);
        if (account) {
            return {
                account: account,
                access: await this.generateJwt(
                    { sub: account.id, role: account.role },
                    Date.now() + 5 * 60 * 1000
                ),
                refresh: await this.generateJwt(
                    { sub: account.id },
                    Date.now() + 15 * 60 * 1000
                )
            };
        }
    }

    public async refresh(refreshToken: string): Promise<TokenPair> {
        const payload =
            this.jwtService.verify<RefreshTokenPayload>(refreshToken);
        const account = await Account.findOneBy({ id: payload.sub });
        if (!account) {
            throw new UnauthorizedException("Invalid token payload");
        }
        return {
            access: await this.generateJwt(
                { sub: account.id, role: account.role },
                Date.now() + 5 * 60 * 1000
            ),
            refresh: await this.generateJwt(
                { sub: account.id },
                Date.now() + 15 * 60 * 1000
            )
        };
    }

    //add this
    public async getMe(accountId: string): Promise<Account> {
        const account = await Account.findOneBy({ id: accountId });
        if (!account) {
            throw new UnauthorizedException("Account not found");
        }
        return account;
    }

    //TODO we need to talk about soft delete
    public async deleteMe(accountId: string): Promise<void> {
        const account = await Account.findOneBy({ id: accountId });
        if (!account) {
            throw new UnauthorizedException("Account not found");
        }
        await account.softRemove();
    }

    private async validateUser(dto: LoginDto) {
        const account = await this.dataSource.manager.findOneBy(Account, {
            email: dto.data.attributes.email
        });
        if (account) {
            const isCorrect = await Hasher.compare(
                dto.data.attributes.password,
                account.password
            );
            if (!isCorrect) {
                return null;
            }
        }
        return account;
    }

    private async generateJwt(payload, expires: number) {
        return {
            token: await this.jwtService.signAsync(payload, {
                expiresIn: expires
            }),
            expires: expires
        };
    }
}
