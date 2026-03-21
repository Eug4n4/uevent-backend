import { Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
    ValidateNested
} from "class-validator";

export class CompanyAttributes {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    address: string;
}

export class CompanyUpdateAttributes {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;
}

class CompanyData {
    @IsString()
    @Equals("company")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyAttributes)
    attributes: CompanyAttributes;
}

class CompanyUpdateData {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("company")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyUpdateAttributes)
    attributes: CompanyUpdateAttributes;
}

export class CompanyCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyData)
    data: CompanyData;
}

export class CompanyUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyUpdateData)
    data: CompanyUpdateData;
}

export class CompanyQuery {
    @IsOptional()
    @IsString()
    name?: string;

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

export class PageQuery {
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
