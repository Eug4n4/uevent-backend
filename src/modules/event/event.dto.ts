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
import { TagData } from "../company/tag.dto";
import { OmitType } from "@nestjs/swagger";
import { eventFormats } from "src/db/entity/event.entity";

export class EventAttributes {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsBoolean()
    notificationNewTicket: boolean;

    @IsDateString()
    publishAt: Date;

    @IsDateString()
    startAt: Date;

    @IsDateString()
    endAt: Date;

    @IsString()
    @IsIn(eventFormats)
    format: string;

    @IsUUID()
    companyId: string;
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
