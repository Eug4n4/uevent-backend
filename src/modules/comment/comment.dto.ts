import { PickType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
    Equals,
    IsDefined,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Length,
    Max,
    Min,
    ValidateNested
} from "class-validator";

export class CommentCreateAttributes {
    @IsString()
    @Length(1, 255, { message: "Your comment is too long" })
    text: string;

    @IsOptional()
    @IsUUID()
    parent_id?: string;
}

export class CommentUpdateAttributes extends PickType(CommentCreateAttributes, [
    "text"
]) {}

class CommentCreateData {
    @IsString()
    @Equals("comment")
    type: string;

    @IsDefined()
    @ValidateNested()
    @Type(() => CommentCreateAttributes)
    attributes: CommentCreateAttributes;
}

class CommentUpdateData extends PickType(CommentCreateData, ["type"]) {
    @IsDefined()
    @ValidateNested()
    @Type(() => CommentUpdateAttributes)
    attributes: CommentUpdateAttributes;
}

export class CommentCreateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => CommentCreateData)
    data: CommentCreateData;
}

export class CommentUpdateDto {
    @IsDefined()
    @ValidateNested()
    @Type(() => CommentUpdateData)
    data: CommentUpdateData;
}

export class CommentQuery {
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
