import { Transform, Type } from "class-transformer";
import { NullIfEmpty } from "../shared/decorators";
import {
    Equals,
    IsDefined,
    IsBoolean,
    IsEmail,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
    ValidateNested
} from "class-validator";

class LocationDto {
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;
}

export class CompanyAttributes {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    address: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;
}

export class CompanyUpdateAttributes {
    @IsOptional()
    @NullIfEmpty()
    @IsString()
    name?: string;

    @IsOptional()
    @NullIfEmpty()
    @IsString()
    address?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;
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
    @Transform(({ value }) => value === "true" || value === true)
    @IsBoolean()
    me?: boolean;

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

export class BillingAttributes {
    @IsString()
    stripe_account_id: string;
}

class BillingData {
    @IsString()
    @Equals("billing")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => BillingAttributes)
    attributes: BillingAttributes;
}

export class BillingCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => BillingData)
    data: BillingData;
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
