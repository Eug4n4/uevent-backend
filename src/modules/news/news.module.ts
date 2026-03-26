import { Module } from "@nestjs/common";
import { NewsController } from "./news.controller";
import { NewsService } from "./news.service";
import { CompanyModule } from "../company/company.module";

@Module({
    imports: [CompanyModule],
    controllers: [NewsController],
    providers: [NewsService]
})
export class NewsModule {}
