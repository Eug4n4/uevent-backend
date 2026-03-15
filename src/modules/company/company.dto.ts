import { Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsOptional,
    IsString,
    ValidateNested
} from "class-validator";

export class CompanyAttributes {
    @IsString()
    name: string;

    @IsString()
    email: string;

    @IsString()
    address: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsString()
    @IsOptional()
    banner?: string;
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

export class CompanyCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => CompanyData)
    data: CompanyData;
}

// export type EventDetails = EventAttributes & Pick<EventData, "included">;
