import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import cors from "cors";
import { GlobalExceptionFilter } from "./modules/shared/exception.filter";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix("uevent/v1");
    app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
    app.use(cookieParser());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
