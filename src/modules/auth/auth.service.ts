import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { Account } from "src/db/entity/account.entity";
import { DataSource } from "typeorm";
import { Profile } from "src/db/entity/profile.entity";
import { Hasher } from "./hasher";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private dataSource: DataSource
    ) {}

    async register(dto: RegisterDto) {
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

    async login(dto: LoginDto) {
        const account = await this.dataSource.manager.findOneBy(Account, {
            email: dto.data.attributes.email
        });
        if (account) {
            const isCorrect = await Hasher.compare(
                dto.data.attributes.password,
                account.password
            );
            if (isCorrect) {
                const profile = await this.dataSource.manager.findOneBy(
                    Profile,
                    { accountId: account.id }
                );
                return {
                    profile: profile,
                    access: await this.generateAccessToken(account),
                    refresh: await this.generateRefreshToken(account)
                };
            }
        }
    }

    async generateAccessToken(account: Account) {
        const expires = Date.now() + 5 * 60 * 1000;
        const payload = {
            sub: account.id,
            role: account.role
        };

        return {
            token: await this.jwtService.signAsync(payload, {
                expiresIn: expires
            }),
            expires: expires
        };
    }

    async generateRefreshToken(account: Account) {
        const expires = Date.now() + 15 * 60 * 1000;
        const payload = {
            sub: account.id
        };

        return {
            token: await this.jwtService.signAsync(payload, {
                expiresIn: expires
            }),
            expires: expires
        };
    }
}
