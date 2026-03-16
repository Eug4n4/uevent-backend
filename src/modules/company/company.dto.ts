import { Type } from "class-transformer";
import { Equals, IsDefined, IsString, ValidateNested } from "class-validator";

export class CompanyAttributes {
    @IsString()
    name: string;

    @IsString()
    email: string;

    @IsString()
    address: string;
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
