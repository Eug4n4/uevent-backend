import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    Param,
    Query,
    Req,
    Res,
    HttpStatus,
    HttpCode,
    UseGuards,
    UseInterceptors,
    UploadedFile
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto, FilterProfilesDto } from "./profile.dto";
import { JwtGuard } from "../shared/jwt.guard";
import { profileResponse, profilesResponse } from "./profile.response";
import { CurrentUser } from "../shared/decorators";

@Controller("profiles")
export class ProfileController {
    constructor(private profileService: ProfileService) {}

    @UseGuards(JwtGuard)
    @Get("me")
    async getMyProfile(
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        const profile = await this.profileService.getMyProfile(user.id);
        return res.json(profileResponse(profile));
    }

    @UseGuards(JwtGuard)
    @Patch("me")
    async updateMyProfile(
        @CurrentUser() user: Express.User,
        @Res() res: Response,
        @Body() dto: UpdateProfileDto
    ) {
        const profile = await this.profileService.updateMyProfile(user.id, dto);
        return res.json(profileResponse(profile));
    }

    @UseGuards(JwtGuard)
    @Post("me/avatar")
    @UseInterceptors(FileInterceptor("avatar"))
    async uploadAvatar(
        @CurrentUser() user: Express.User,
        @Res() res: Response,
        @UploadedFile() file: Express.Multer.File
    ) {
        const profile = await this.profileService.uploadAvatar(user.id, file);
        return res.json(profileResponse(profile));
    }

    @UseGuards(JwtGuard)
    @Delete("me/avatar")
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAvatar(
        @CurrentUser() user: Express.User,
        @Res() res: Response
    ) {
        await this.profileService.deleteAvatar(user.id);
        return res.status(HttpStatus.NO_CONTENT).send();
    }

    @Get()
    async filterProfiles(
        @Req() req: Request,
        @Res() res: Response,
        @Query() dto: FilterProfilesDto
    ) {
        const [profiles, total] = await this.profileService.filterProfiles(dto);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/profiles`;
        return res.json(
            profilesResponse(
                profiles,
                total,
                dto["page[limit]"] ?? 20,
                dto["page[offset]"] ?? 0,
                baseUrl
            )
        );
    }

    @Get("@:username")
    async getProfileByUsername(
        @Param("username") username: string,
        @Res() res: Response
    ) {
        const profile =
            await this.profileService.getProfileByUsername(username);
        return res.json(profileResponse(profile));
    }

    @Get(":account_id")
    async getProfileById(
        @Param("account_id") accountId: string,
        @Res() res: Response
    ) {
        const profile = await this.profileService.getProfileById(accountId);
        return res.json(profileResponse(profile));
    }
}
