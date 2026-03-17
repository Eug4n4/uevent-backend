import { Type } from "class-transformer";
import {
    Equals,
    IsBoolean,
    IsDateString,
    IsDefined,
    IsOptional,
    IsString,
    IsUUID,
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

export type EventDetails = EventAttributes & Pick<EventData, "included">;
