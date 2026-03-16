import { Module } from "@nestjs/common";
import { CompanyController } from "./company.controller";
import { CompanyService } from "./company.service";
import { ProfileModule } from "../profile/profile.module";

@Module({
    imports: [ProfileModule],
    controllers: [CompanyController],
    providers: [CompanyService],
    exports: [CompanyService]
})
export class CompanyModule {}
