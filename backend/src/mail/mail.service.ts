import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateEmailUserDto } from './dto/create-mail.dto';
import { Mail } from './entities/mail';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService,
              @InjectRepository(Mail) private mailRepository: Repository<Mail>
  ) {}
  async getAllMails(){
    return this.mailRepository.find();
  }

  async createMail(createEmailUserDto: CreateEmailUserDto) {
    const mail = this.mailRepository.create(createEmailUserDto);
    return this.mailRepository.save(mail);
  }

  async deleteMail(id: number) {
    const mail = await this.mailRepository.findOne({
      where: { idMail: id }
    });
    if (!mail) {
      throw new Error('Mail not found');
    }
    return this.mailRepository.delete(id);
  }

  async sendWithAttachment(params: {
    to: string;
    subject: string;
    html: string;
    attachment?: { filename: string; content?: Buffer; path?: string; contentType?: string };
  }) {
    const attachments = params.attachment
      ? [{ filename: params.attachment.filename, content: params.attachment.content, path: params.attachment.path, contentType: params.attachment.contentType }]
      : [];

    return this.mailer.sendMail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments,
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    return this.mailer.sendMail({
      to,
      subject,
      html,
    });
  }
}
