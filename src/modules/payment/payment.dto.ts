import { Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested
} from "class-validator";

export class PurchaseAttributes {
    @IsOptional()
    @IsString()
    promo_code?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity?: number;

}

class PurchaseData {
    @IsString()
    @Equals("purchase")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => PurchaseAttributes)
    attributes: PurchaseAttributes;
}

export class PurchaseDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => PurchaseData)
    data: PurchaseData;
}

export class UserTicketUpdateAttributes {
    @IsIn(["used", "unused"])
    status: "used" | "unused";
}

class UserTicketUpdateData {
    @IsString()
    @Equals("user_ticket")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => UserTicketUpdateAttributes)
    attributes: UserTicketUpdateAttributes;
}

export class UserTicketUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => UserTicketUpdateData)
    data: UserTicketUpdateData;
}

export class UserTicketPageQuery {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    "page[limit]"?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    "page[offset]"?: number;
}

export class TransactionQuery {
    @IsOptional()
    @IsUUID()
    account_id?: string;

    @IsOptional()
    @IsUUID()
    company_id?: string;

    @IsOptional()
    @IsUUID()
    ticket_id?: string;

    @IsOptional()
    @IsUUID()
    event_id?: string;

    @IsOptional()
    @IsUUID()
    promo_code_id?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    "page[limit]"?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    "page[offset]"?: number;
}
