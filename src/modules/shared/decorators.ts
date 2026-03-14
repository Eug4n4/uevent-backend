import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): Express.User => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    }
);
