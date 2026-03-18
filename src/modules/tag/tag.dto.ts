import { Transform, Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Matches,
    Max,
    Min,
    ValidateNested
} from "class-validator";

export class TagAttributes {
    @IsString()
    @Length(1, 50)
    @Matches(/^[a-zA-Z]+$/, { message: "Tag name must contain only letters" })
    name: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class TagUpdateAttributes {
    @IsOptional()
    @IsString()
    @Length(1, 50)
    @Matches(/^[a-zA-Z]+$/, { message: "Tag name must contain only letters" })
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

class TagData {
    @IsString()
    @Equals("tag")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => TagAttributes)
    attributes: TagAttributes;
}

class TagUpdateData {
    @IsUUID()
    id: string;

    @IsString()
    @Equals("tag")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => TagUpdateAttributes)
    attributes: TagUpdateAttributes;
}

export class TagCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => TagData)
    data: TagData;
}

export class TagUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => TagUpdateData)
    data: TagUpdateData;
}

export class TagQuery {
    @IsOptional()
    @IsString()
    name?: string;

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
