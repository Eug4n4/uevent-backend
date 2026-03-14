import {
    IsString,
    IsUUID,
    IsOptional,
    MinLength,
    MaxLength,
    Matches,
    IsInt,
    Min,
    Max
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateProfileAttributesDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(32)
    @Matches(/^[a-zA-Z0-9\-._!]+$/, {
        message: "Username can only contain letters, numbers, and -._!"
    })
    username?: string;

    @IsOptional()
    @IsString()
    @MaxLength(512)
    pseudonym?: string;
}

export class UpdateProfileDataDto {
    @IsUUID()
    id: string;

    @IsString()
    type: string;

    @IsOptional()
    attributes?: UpdateProfileAttributesDto;
}

export class UpdateProfileDto {
    data: UpdateProfileDataDto;
}

export class FilterProfilesDto {
    @IsOptional()
    @IsString()
    text?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    "page[limit]"?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    "page[offset]"?: number;
}