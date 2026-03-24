import { OmitType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { NullIfEmpty } from "../shared/decorators";
import {
    Equals,
    IsDefined,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    ValidateNested
} from "class-validator";

export class NewsAttributes {
    @IsString()
    @MaxLength(255)
    name: string;

    @IsString()
    @MaxLength(255)
    text: string;
}

export class NewsUpdateAttributes {
    @IsOptional()
    @NullIfEmpty()
    @IsString()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @NullIfEmpty()
    @IsString()
    @MaxLength(255)
    text?: string;
}

class CompanyRef {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("company")
    type: string;
}

class CompanyRelationships {
    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyRef)
    data: CompanyRef;
}

class NewsRelationships {
    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyRelationships)
    company: CompanyRelationships;
}

class NewsData {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("news")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => NewsAttributes)
    attributes: NewsAttributes;
}

class NewsCreateData extends OmitType(NewsData, ["id"]) {
    @IsDefined()
    @ValidateNested()
    @Type(() => NewsRelationships)
    relationships: NewsRelationships;
}

class NewsUpdateData extends OmitType(NewsData, ["attributes"] as const) {
    @IsDefined()
    @ValidateNested()
    @Type(() => NewsUpdateAttributes)
    attributes: NewsUpdateAttributes;
}

export class NewsCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => NewsCreateData)
    data: NewsCreateData;
}

export class NewsUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => NewsUpdateData)
    data: NewsUpdateData;
}

export class NewsQuery {
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

    @IsOptional()
    @IsUUID()
    company_id?: string;

    @IsOptional()
    @IsString()
    text?: string;
}

export type NewsCreateDetails = NewsAttributes & { company_id: string };
