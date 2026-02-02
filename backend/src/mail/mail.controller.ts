import { Controller, Get, Post, Delete, Param, Body } from "@nestjs/common";
import { MailService } from "./mail.service";

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get()
  getAllMails() {
    return this.mailService.getAllMails();
  }

  @Post()
  createMail(@Body() createEmailUserDto) {
    return this.mailService.createMail(createEmailUserDto);
  }

  @Delete(':id')
  deleteMail(@Param('id') id: number) {
    console.log(`Deleting mail with id: ${id}`);
    return this.mailService.deleteMail(id);
  }

  @Post('send')
  sendEmail(@Body() body: { to: string; subject: string; html: string }) {
    const { to, subject, html } = body;
    return this.mailService.sendEmail(to, subject, html);
  }
}