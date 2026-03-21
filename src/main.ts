import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import cors from "cors";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix("uevent/v1");
    app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
    app.use(cookieParser());
    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true })
    );
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
