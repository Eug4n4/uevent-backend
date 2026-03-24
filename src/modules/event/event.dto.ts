import { Transform, Type } from "class-transformer";
import {
    Equals,
    IsArray,
    IsBoolean,
    IsDateString,
    IsDefined,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    ValidateNested
} from "class-validator";
class TagIdRef {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("tag")
    type: string;
}

class TagRelationships {
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TagIdRef)
    data?: TagIdRef[];
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

class EventRelationships {
    @IsOptional()
    @ValidateNested()
    @Type(() => TagRelationships)
    tags?: TagRelationships;

    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyRelationships)
    company: CompanyRelationships;
}
import { OmitType, PartialType } from "@nestjs/swagger";
import { eventFormats } from "src/db/entity/event.entity";

export class EventAttributes {
    @IsString()
    title: string;

    @IsDateString()
    publish_at: Date;

    @IsDateString()
    start_at: Date;

    @IsDateString()
    end_at: Date;

    @IsString()
    @IsIn(eventFormats)
    format: string;

    @IsString()
    @MaxLength(10000)
    text: string;
}

class EventData {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("event")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => EventAttributes)
    attributes: EventAttributes;
}

class EventCreateData extends OmitType(EventData, ["id"]) {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventRelationships)
    relationships: EventRelationships;
}

export class EventCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventCreateData)
    data: EventCreateData;
}

class EventUpdateAttributes extends PartialType(EventAttributes) {
    @IsOptional()
    @IsUUID()
    company_id?: string;
}

class EventUpdateData {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("event")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => EventUpdateAttributes)
    attributes: EventUpdateAttributes;
}

export class EventUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventUpdateData)
    data: EventUpdateData;
}

export class EventTagsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TagIdRef)
    data: TagIdRef[];
}

const eventSortingOptions = [
    "start_at",
    "-start_at",
    "end_at",
    "-end_at",
    "publish_at",
    "-publish_at"
];

export class EventQuery {
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
    @IsIn(eventSortingOptions)
    "sort"?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined) return undefined;
        return String(value)
            .split(",")
            .map((v) => v.trim());
    })
    @IsArray()
    @IsIn(eventFormats, { each: true })
    "format"?: string[];

    @IsOptional()
    @Transform(({ value }) => (typeof value === "string" ? [value] : value))
    @IsArray()
    "tag"?: string[];

    @IsOptional()
    @Transform(({ value }) => (typeof value === "string" ? [value] : value))
    @IsArray()
    @IsUUID(undefined, { each: true })
    "tag_id"?: string[];

    @IsOptional()
    @IsUUID()
    "company_id"?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined) return undefined;
        const values = String(value).split(",");
        return values.map((v) => v.trim() === "true");
    })
    @IsArray()
    @IsBoolean({ each: true })
    "published"?: boolean[];

    @IsOptional()
    @IsUUID()
    "subscribed_by_user"?: string;

    @IsOptional()
    @IsString()
    "text"?: string;

    @IsOptional()
    @IsDateString()
    "start_after"?: string;

    @IsOptional()
    @IsDateString()
    "start_before"?: string;

    @IsOptional()
    @IsDateString()
    "end_after"?: string;

    @IsOptional()
    @IsDateString()
    "end_before"?: string;
}

export type EventDetails = EventAttributes & {
    company_id: string;
    tagIds?: string[];
};
export type EventUpdateDetails = EventUpdateAttributes;

export const parseIncludes = (include?: string): Set<string> =>
    new Set(
        (include ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
    );

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
