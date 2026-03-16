import { Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsOptional,
    IsString,
    Length,
    Matches,
    ValidateNested
} from "class-validator";

export class TagAttributes {
    @IsString()
    @Length(1, 50)
    @Matches(/^[a-zA-Z]+$/, { message: "Tag's name must contain only letters" })
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class TagData {
    @IsString()
    @Equals("tag")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => TagAttributes)
    attributes: TagAttributes;
}

export class TagCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => TagData)
    data: TagData;
}
