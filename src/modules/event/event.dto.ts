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

export class EventCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventData)
    data: EventData;
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
