import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { CompanyCreateDto } from "./company.dto";
import { CompanyService } from "./company.service";
import type { Request } from "express";
import { JwtGuard } from "../shared/jwt.guard";

/* 
{
  "data": {
    "type": "company",
    "attributes": {
      "name":"",
      "email":"",
      "address":"",
      "avatar":"",
      "banner":""
    }
  }
}

*/

@Controller("company")
export class CompanyController {
    constructor(private companyService: CompanyService) {}

    @UseGuards(JwtGuard)
    @Post()
    async create(@Body() dto: CompanyCreateDto, @Req() req: Request) {
        await this.companyService.create(dto.data.attributes, req.user!.id);
    }
}
