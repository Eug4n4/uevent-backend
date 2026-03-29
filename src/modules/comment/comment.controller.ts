import {
    Body,
    ConflictException,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    UseGuards
} from "@nestjs/common";
import { JwtGuard } from "../shared/jwt.guard";
import {
    CommentCreateDto,
    CommentQuery,
    CommentUpdateDto
} from "./comment.dto";
import { CurrentUser } from "../shared/decorators";
import { EventComment } from "src/db/entity/event.entity";
import type { Request, Response } from "express";
import { commentResponse, paginatedComments } from "./comment.response";
import { DEFAULT_PAGE_LIMIT, DEFAULT_PAGE_OFFSET } from "../shared/constants";
import { CommentService } from "./comment.service";

@Controller("comments")
export class CommentController {
    constructor(private commentService: CommentService) {}

    @UseGuards(JwtGuard)
    @Post(":event_id")
    async create(
        @Param("event_id") eventId: string,
        @CurrentUser() user: Express.User,
        @Body() dto: CommentCreateDto,
        @Res() res: Response
    ) {
        const attributes = dto.data.attributes;
        try {
            const newComment = EventComment.create({
                profileId: user.id,
                eventId,
                text: attributes.text
            });
            if (attributes.parent_id) {
                const parent = await EventComment.findOneBy({
                    id: attributes.parent_id
                });
                if (!parent) {
                    throw new ConflictException(
                        `Can't find parent comment with id ${attributes.parent_id}`
                    );
                }
                newComment.parent = parent;
            }
            await newComment.save();

            return res.json(commentResponse(newComment));
        } catch (e) {
            throw new ConflictException(
                `Failed to create a comment: ${e?.message}`
            );
        }
    }

    @Get(":event_id")
    async getForEvent(
        @Param("event_id") eventId: string,
        @Query() query: CommentQuery,
        @Req() req: Request,
        @Res() res: Response
    ) {
        if (query["page[limit]"] === undefined) {
            query["page[limit]"] = DEFAULT_PAGE_LIMIT;
        }
        if (query["page[offset]"] === undefined) {
            query["page[offset]"] = DEFAULT_PAGE_OFFSET;
        }
        const comments = await this.commentService.getAll(query, eventId);
        const baseUrl = `${req.protocol}://${req.get("host")}/uevent/v1/comments`;
        res.json(paginatedComments(comments, query, comments.length, baseUrl));
    }

    @UseGuards(JwtGuard)
    @Patch(":comment_id")
    async update(
        @Param("comment_id") commentId: string,
        @CurrentUser() user: Express.User,
        @Body() dto: CommentUpdateDto,
        @Res() res: Response
    ) {
        const comment = await this.getOwn(commentId, user.id);
        comment.text = dto.data.attributes.text;
        await comment.save();
        res.json(commentResponse(comment));
    }

    @UseGuards(JwtGuard)
    @Delete(":comment_id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param("comment_id") commentId: string,
        @CurrentUser() user: Express.User
    ) {
        const comment = await this.getOwn(commentId, user.id);
        await comment.softRemove();
    }

    private async getOwn(commentId: string, profileId: string) {
        const comment = await EventComment.findOneBy({
            id: commentId,
            profileId
        });
        if (comment === null) {
            throw new NotFoundException({
                message: `Can't find comment with id ${commentId}`
            });
        }
        return comment;
    }
}
