import { Module } from "@nestjs/common";
import { NewsController } from "./news.controller";
import { NewsService } from "./news.service";
import { CompanyModule } from "../company/company.module";
import { MailModule } from "../mail/mail.module";

@Module({
    imports: [CompanyModule, MailModule],
    controllers: [NewsController],
    providers: [NewsService]
})
export class NewsModule {}
