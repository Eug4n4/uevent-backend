import { Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsString,
    Length,
    Matches,
    ValidateNested
} from "class-validator";
import { USERNAME_PATTERN } from "../shared/constants";
import { UserRole } from "./auth.types";

export class LoginAttributes {
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

export class RegisterAttributes {
    @IsString()
    @Length(6, 256, { message: "Email length must be in range [6, 256]" })
    email: string;

    @IsString()
    @Length(3, 32)
    @Matches(USERNAME_PATTERN)
    username: string;

    @IsString()
    @Length(6)
    password: string;
}

class RegisterData {
    @IsString()
    @Equals("account")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => RegisterAttributes)
    attributes: RegisterAttributes;
}

export class RegisterDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => RegisterData)
    data: RegisterData;
}

export type GoogleAuthDto = Omit<RegisterAttributes, "password"> & {
    avatarKey: string;
};

export type CreateAccountAttributes =
    | ({ role?: UserRole } & GoogleAuthDto)
    | RegisterAttributes;
