import {
    Injectable,
    NotFoundException,
    ForbiddenException
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Profile } from "src/db/entity/profile.entity";
import { UpdateProfileDto, FilterProfilesDto } from "./profile.dto";
import { S3Service } from "../shared/s3.uploader";

@Injectable()
export class ProfileService {
    constructor(
        private dataSource: DataSource,
        private s3Service: S3Service
    ) {}

    async getMyProfile(accountId: string): Promise<Profile> {
        const profile = await this.dataSource.manager.findOneBy(Profile, {
            accountId
        });
        if (!profile) throw new NotFoundException("Profile not found");
        return profile;
    }

    async updateMyProfile(
        accountId: string,
        dto: UpdateProfileDto
    ): Promise<Profile> {
        if (dto.data.id !== accountId) {
            throw new ForbiddenException(
                "Cannot update another user's profile"
            );
        }
        const profile = await this.getMyProfile(accountId);
        const attrs = dto.data.attributes;
        if (attrs?.username) profile.username = attrs.username;
        await profile.save();
        return profile;
    }

    async uploadAvatar(
        accountId: string,
        file: Express.Multer.File
    ): Promise<Profile> {
        const profile = await this.getMyProfile(accountId);
        if (profile.avatar !== "default.png") {
            const key = this.s3Service.getKeyFromUrl(profile.avatar);
            if (key) await this.s3Service.deleteObject(key);
        }
        const { url } = await this.s3Service.putProfileAvatar(
            accountId,
            file.buffer,
            file.mimetype
        );
        profile.avatar = url;
        await profile.save();
        return profile;
    }

    async deleteAvatar(accountId: string): Promise<void> {
        const profile = await this.getMyProfile(accountId);
        if (profile.avatar === "default.png") {
            throw new NotFoundException("Avatar not found");
        }
        const key = this.s3Service.getKeyFromUrl(profile.avatar);
        if (key) await this.s3Service.deleteObject(key);
        profile.avatar = "default.png";
        await profile.save();
    }

    async getProfileById(accountId: string): Promise<Profile> {
        const profile = await this.dataSource.manager.findOne(Profile, {
            where: { accountId },
            relations: { account: true }
        });
        if (!profile || profile.account.deletedAt) {
            throw new NotFoundException("Profile not found");
        }
        return profile;
    }

    async getProfileByUsername(username: string): Promise<Profile> {
        const profile = await this.dataSource.manager.findOne(Profile, {
            where: { username },
            relations: { account: true }
        });
        if (!profile || profile.account.deletedAt) {
            throw new NotFoundException("Profile not found");
        }
        return profile;
    }

    async filterProfiles(dto: FilterProfilesDto): Promise<[Profile[], number]> {
        const qb = this.dataSource.manager
            .createQueryBuilder(Profile, "profile")
            .innerJoin("profile.account", "account")
            .where("account.deleted_at IS NULL");

        if (dto.text) {
            qb.andWhere("profile.username ILIKE :text", {
                text: `${dto.text}%`
            });
        }
        qb.limit(dto["page[limit]"] ?? 20);
        qb.offset(dto["page[offset]"] ?? 0);
        return qb.getManyAndCount();
    }
}
