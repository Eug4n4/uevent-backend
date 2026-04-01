import { Transform, Type } from "class-transformer";
import {
    Equals,
    IsArray,
    IsBoolean,
    IsDateString,
    IsDefined,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
    ValidateNested
} from "class-validator";
import { eventFormats, VisitorsVisibility } from "src/db/entity/event.entity";

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

// tag ref
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

// company ref
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

// event relationships
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

// event create
class EventCreateAttributes {
    @IsString()
    title: string;

    @IsString()
    @IsIn(eventFormats)
    format: string;

    @IsString()
    @MaxLength(10000)
    text: string;

    @IsDateString()
    publish_at: Date;

    @IsDateString()
    start_at: Date;

    @IsDateString()
    end_at: Date;

    @IsOptional()
    @IsBoolean()
    notification_new_tickets?: boolean;

    @IsOptional()
    @IsIn(Object.values(VisitorsVisibility))
    visitors_visibility?: VisitorsVisibility;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;
}

class EventCreateData {
    @IsString()
    @Equals("event")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => EventCreateAttributes)
    attributes: EventCreateAttributes;

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

// event update
export class EventUpdateAttributes {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    @IsIn(eventFormats)
    format?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    text?: string;

    @IsOptional()
    @IsDateString()
    publish_at?: Date;

    @IsOptional()
    @IsDateString()
    start_at?: Date;

    @IsOptional()
    @IsDateString()
    end_at?: Date;

    @IsOptional()
    @IsUUID()
    company_id?: string;

    @IsOptional()
    @IsBoolean()
    notification_new_tickets?: boolean;

    @IsOptional()
    @IsIn(Object.values(VisitorsVisibility))
    visitors_visibility?: VisitorsVisibility;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;
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

// event tags
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
    @Transform(({ value }) => {
        if (value === undefined) return undefined;
        return String(value)
            .split(",")
            .map((v) => v.trim());
    })
    @IsArray()
    @IsIn(["active", "canceled"], { each: true })
    "status"?: string[];

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

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    near_lat?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    near_lng?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    near_radius_m?: number;
}

export type EventDetails = EventCreateAttributes & {
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

export class VisitorsQuery extends PageQuery {
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined) return undefined;
        return String(value)
            .split(",")
            .map((v) => v.trim() === "true");
    })
    @IsArray()
    @IsBoolean({ each: true })
    tickets_visibility?: boolean[];
}
