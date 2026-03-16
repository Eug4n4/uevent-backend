import { Module } from "@nestjs/common";
import { EventController } from "./event.controller";
import { EventService } from "./event.service";
import { CompanyModule } from "../company/company.module";

@Module({
    imports: [CompanyModule],
    controllers: [EventController],
    providers: [EventService]
})
export class EventModule {}
