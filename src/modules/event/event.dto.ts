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
    Min,
    ValidateNested
} from "class-validator";
import { TagData } from "../tag/tag.dto";
import { OmitType, PartialType } from "@nestjs/swagger";
import { eventFormats } from "src/db/entity/event.entity";

export class EventAttributes {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsBoolean()
    notification_new_ticket: boolean;

    @IsDateString()
    publish_at: Date;

    @IsDateString()
    start_at: Date;

    @IsDateString()
    end_at: Date;

    @IsString()
    @IsIn(eventFormats)
    format: string;

    @IsUUID()
    company_id: string;
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

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TagData)
    included?: TagData[];
}

class EventCreateData extends OmitType(EventData, ["id"]) {}

export class EventCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventCreateData)
    data: EventCreateData;
}

class EventUpdateAttributes extends PartialType(EventAttributes) {}

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

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => TagData)
    included?: TagData[];
}

export class EventUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventUpdateData)
    data: EventUpdateData;
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
    @IsString()
    "format"?: string;

    @IsOptional()
    @Transform(({ value }) => (typeof value === "string" ? [value] : value))
    @IsArray()
    "tag"?: string[];
}

export type EventDetails = EventAttributes & Pick<EventData, "included">;
export type EventUpdateDetails = EventUpdateAttributes &
    Pick<EventUpdateData, "included">;

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
