import { Module } from "@nestjs/common";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";
import { CompanyModule } from "../company/company.module";
import { ProfileModule } from "../profile/profile.module";
import { MailModule } from "../mail/mail.module";

@Module({
    imports: [CompanyModule, ProfileModule, MailModule],
    controllers: [EventController],
    providers: [EventService]
})
export class EventModule {}
