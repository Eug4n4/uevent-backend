import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
    JwtAccessStrategy,
    JwtRefreshStrategy
} from "./strategies/jwt.strategy";
import { PassportModule } from "@nestjs/passport";

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get("JWT_SECRET")
            }),
            inject: [ConfigService]
        })
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy]
})
export class AuthModule {}
