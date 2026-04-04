import { Transform, Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    Length,
    Max,
    Min,
    IsDefined,
    IsIn,
    ValidateNested,
    Equals,
    IsUUID,
    Validate,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from "class-validator";

@ValidatorConstraint()
class IsZeroOrAtLeastOne implements ValidatorConstraintInterface {
    validate(value: number) {
        return value === 0 || value >= 1;
    }
    defaultMessage() {
        return "price must be 0 or at least 1";
    }
}

//event ref
class EventRef {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("event")
    type: string;
}

class EventRelationship {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventRef)
    data: EventRef;
}

//ticket ref
class TicketRef {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("ticket")
    type: string;
}

class TicketRelationship {
    @IsDefined()
    @ValidateNested()
    @Type(() => TicketRef)
    data: TicketRef;
}

//ticket's ref
class TicketRelationships {
    @IsDefined()
    @ValidateNested()
    @Type(() => EventRelationship)
    event: EventRelationship;
}

//promo-code relationships
class PromoCodeRelationships {
    @IsDefined()
    @ValidateNested()
    @Type(() => TicketRelationship)
    ticket: TicketRelationship;
}

// ticket create
class TicketCreateAttributes {
    @IsString()
    @Length(1, 255)
    name: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    description?: string;

    @IsNumber()
    @Min(0)
    @Validate(IsZeroOrAtLeastOne)
    price: number;

    @IsInt()
    @Min(1)
    total: number;
}

class TicketCreateData {
    @IsString()
    @Equals("ticket")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => TicketCreateAttributes)
    attributes: TicketCreateAttributes;

    @IsDefined()
    @ValidateNested()
    @Type(() => TicketRelationships)
    relationships: TicketRelationships;
}

export class TicketCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => TicketCreateData)
    data: TicketCreateData;
}

//ticket update
export class TicketUpdateAttributes {
    @IsOptional()
    @IsString()
    @Length(1, 255)
    name?: string;

    @IsOptional()
    @IsString()
    @Length(1, 255)
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Validate(IsZeroOrAtLeastOne)
    price?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    total?: number;
}

class TicketUpdateData {
    @IsString()
    @Equals("ticket")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => TicketUpdateAttributes)
    attributes: TicketUpdateAttributes;
}

export class TicketUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => TicketUpdateData)
    data: TicketUpdateData;
}

//promo-code create
export class PromoCodeCreateAttributes {
    @IsString()
    @Length(1, 50)
    code: string;

    @IsInt()
    @Min(1)
    @Max(100)
    discount_percent: number;

    @IsInt()
    @Min(1)
    total: number;
}

class PromoCodeCreateData {
    @IsString()
    @Equals("promo_code")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => PromoCodeCreateAttributes)
    attributes: PromoCodeCreateAttributes;

    @IsDefined()
    @ValidateNested()
    @Type(() => PromoCodeRelationships)
    relationships: PromoCodeRelationships;
}

export class PromoCodeCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => PromoCodeCreateData)
    data: PromoCodeCreateData;
}

//promo-code update
export class PromoCodeUpdateAttributes {
    @IsInt()
    @Min(1)
    total: number;
}

class PromoCodeUpdateData {
    @IsString()
    @Equals("promo_code")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => PromoCodeUpdateAttributes)
    attributes: PromoCodeUpdateAttributes;
}

export class PromoCodeUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => PromoCodeUpdateData)
    data: PromoCodeUpdateData;
}

const ticketSortingOptions = ["price", "-price", "created_at", "-created_at"];

export class TicketQuery {
    @IsOptional()
    @IsUUID()
    event_id?: string;

    @IsOptional()
    @IsUUID()
    company_id?: string;

    @IsOptional()
    @Transform(({ value }) => value === "true")
    @IsBoolean()
    available?: boolean;

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
    @IsIn(ticketSortingOptions)
    "sort"?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    "min_cost"?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    "max_cost"?: number;

    @IsOptional()
    @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
    @IsArray()
    @IsIn(["active", "canceled"], { each: true })
    "status"?: string[];

}

const promoCodeSortingOptions = ["created_at", "-created_at", "discount_percent", "-discount_percent"];

export class PromoCodeQuery {
    @IsOptional()
    @IsUUID()
    ticket_id?: string;

    @IsOptional()
    @IsUUID()
    event_id?: string;

    @IsOptional()
    @IsString()
    @Length(1, 50)
    code?: string;

    @IsOptional()
    @Transform(({ value }) => value === "true")
    @IsBoolean()
    available?: boolean;

    @IsOptional()
    @Transform(({ value }) => (typeof value === "string" ? value.split(",") : value))
    @IsArray()
    @IsIn(["active", "canceled"], { each: true })
    status?: string[];

    @IsOptional()
    @IsIn(promoCodeSortingOptions)
    sort?: string;

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
