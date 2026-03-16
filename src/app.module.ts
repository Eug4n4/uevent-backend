import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { CompanyModule } from "./modules/company/company.module";
import { EventModule } from "./modules/event/event.module";

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
        TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            synchronize: true,
            entities: [`${__dirname}/db/entity/*{.js,.ts}`]
        }),
        AuthModule,
        ProfileModule,
        CompanyModule,
        EventModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
