import { Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsString,
    Length,
    ValidateNested
} from "class-validator";

class LoginAttributes {
    @IsString()
    @Length(6, 256, { message: "Email length must be in range [6, 256]" })
    email: string;
    @IsString()
    @Length(6)
    password: string;
}

class LoginData {
    @IsString()
    @Equals("account")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => LoginAttributes)
    attributes: LoginAttributes;
}

export class LoginDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => LoginData)
    data: LoginData;
}
