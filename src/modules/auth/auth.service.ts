import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { database } from "src/db/data-source";
import {
    LoginDto,
    RegisterAttributes,
    CreateAccountAttributes
} from "./auth.dto";
import { GoogleIdTokenPayload, type TokenPair } from "./auth.types";
import { Account } from "src/db/entity/account.entity";
import { CompanyMember } from "src/db/entity/company.entity";
import { Profile } from "src/db/entity/profile.entity";
import { Hasher } from "./hasher";
import { GoogleOAuth } from "./google.oauth";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private oauth: GoogleOAuth
    ) {}

    public async deleteAccount(accountId: string) {
        const members = await database.dataSource.manager
            .createQueryBuilder(CompanyMember, "cm")
            .innerJoin("cm.company", "company")
            .where("cm.account_id = :accountId", { accountId })
            .andWhere("company.deleted_at IS NULL")
            .getMany();

        if (members.length > 0) {
            throw new ForbiddenException(
                "You must leave all active companies before deleting your account"
            );
        }

        const account = await Account.findOneBy({ id: accountId });
        if (!account) {
            throw new ForbiddenException("Account not found");
        }

        await account.softRemove();
    }

    public async register(dto: RegisterAttributes) {
        const existingEmail = await Account.findOneBy({
            email: dto.email
        });
        if (existingEmail) {
            throw new ConflictException(
                "Account with this email already exists"
            );
        }
        const existingUsername = await Profile.findOneBy({
            username: dto.username
        });
        if (existingUsername) {
            throw new ConflictException(
                "Account with this username already exists"
            );
        }
        const hashResult = await Hasher.hash(dto.password);
        dto.password = `${hashResult.salt}$${hashResult.hash}$${hashResult.keylen}`;
        await this.createAccount(dto);
    }

    public async login(dto: LoginDto) {
        const account = await this.validateUser(dto);
        if (account) {
            return {
                account: account,
                access: await this.generateJwt(
                    { sub: account.id, role: account.role },
                    Date.now() + Number(process.env.JWT_ACCESS_TTL_SEC ?? 300) * 1000
                ),
                refresh: await this.generateJwt(
                    { sub: account.id },
                    Date.now() + Number(process.env.JWT_REFRESH_TTL_SEC ?? 900) * 1000
                )
            };
        }
    }

    public async loginWithGoogle(code: string) {
        const creds = await this.oauth.authenticate(code);
        let account: Account | null;

        if (creds.id_token != null) {
            const payload = this.jwtService.decode<GoogleIdTokenPayload>(
                creds.id_token
            );
            account = await database.dataSource.manager.findOneBy(Account, {
                email: payload.email
            });
            if (account === null) {
                account = await this.createAccount({
                    email: payload.email,
                    username: `${payload.given_name}${payload.family_name}`,
                    avatarKey: payload.picture
                });
            } else {
                await Profile.update({ accountId: account.id }, { avatarKey: payload.picture })
            }
        } else {
            throw new UnauthorizedException("Google authentication failed");
        }

        return {
            account: account,
            access: await this.generateJwt(
                { sub: account.id, role: account.role },
                Date.now() + Number(process.env.JWT_ACCESS_TTL_SEC ?? 300) * 1000
            ),
            refresh: await this.generateJwt(
                { sub: account.id },
                Date.now() + Number(process.env.JWT_REFRESH_TTL_SEC ?? 900) * 1000
            )
        };
    }

    public generateGoogleAuthUrl() {
        return this.oauth.generateAuthUrl();
    }

    public async refresh(accountId: string): Promise<TokenPair> {
        const account = await Account.findOneBy({ id: accountId });
        if (!account) {
            throw new UnauthorizedException("Account not found");
        }
        return {
            access: await this.generateJwt(
                { sub: account.id, role: account.role },
                Date.now() + Number(process.env.JWT_ACCESS_TTL_SEC ?? 300) * 1000
            ),
            refresh: await this.generateJwt(
                { sub: account.id },
                Date.now() + Number(process.env.JWT_REFRESH_TTL_SEC ?? 900) * 1000
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

    public async deleteMe(accountId: string): Promise<void> {
        const account = await Account.findOneBy({ id: accountId });
        if (!account) {
            throw new UnauthorizedException("Account not found");
        }

        const memberCount = await CompanyMember.countBy({ accountId });
        if (memberCount > 0) {
            throw new BadRequestException(
                "You must leave all companies before deleting your account"
            );
        }

        await account.softRemove();
    }

    private async validateUser(dto: LoginDto) {
        const account = await database.dataSource.manager.findOneBy(Account, {
            email: dto.data.attributes.email
        });
        if (!account || !account.password) {
            return null;
        }

        const isCorrect = await Hasher.compare(
            dto.data.attributes.password,
            account.password
        );

        return isCorrect ? account : null;
    }

    private async createAccount(dto: CreateAccountAttributes) {
        const queryRunner = database.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const account = queryRunner.manager.create(Account, {
                ...dto
            });
            await queryRunner.manager.save(account);
            const profile = queryRunner.manager.create(Profile, {
                ...dto,
                account: account
            });
            await queryRunner.manager.save(profile);
            await queryRunner.commitTransaction();
            return account;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    private async generateJwt(payload, expires: number) {
        return {
            token: await this.jwtService.signAsync(payload, {
                expiresIn: Math.floor((expires - Date.now()) / 1000)
            }),
            expires: expires
        };
    }
}
