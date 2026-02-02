import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Res,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ReportService } from './report.service';
import { CreateReportDTO } from './DTO/create-report.DTO';
import { MailService } from 'src/mail/mail.service';
import { Response } from 'express';
import { log } from 'console';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService,
    private readonly mailService: MailService 
  ) {}

  @Post('generate')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'colocacion', maxCount: 1 },
    { name: 'apertura', maxCount: 5 },
  ]))
  async generateReport(
    @UploadedFiles()
    files: {
      colocacion?: Express.Multer.File[];
      apertura?: Express.Multer.File[];
    },
    @Body() reportData: CreateReportDTO,
    @Res() res: Response,
  ) {
    const pdfDoc = await this.reportService.createReport(reportData, files);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=report.pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();
  }

  @Post('auto-generate')
async autoGenerateReport(
  @Body() body: { deviceName: string; email: string },
  @Res() res: Response,
) {
  const { deviceName, email } = body;
  console.log('DeviceName recibido en backend:', deviceName);
  console.log('Email recibido en backend:', email);

  // 1. Crear el PDF (tu servicio ya lo hace)
  const pdfDoc = await this.reportService.createAutoReport(deviceName);

  // Convertirlo a Buffer (para poder adjuntarlo en el mail)
  const chunks: Buffer[] = [];
  const buffer: Buffer = await new Promise((resolve, reject) => {
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', reject);
    pdfDoc.end(); // cerrar doc
  });

  // 2. Enviar por correo
  const html = `
    <p>Buenas tardes,</p>
    <p>Adjuntamos el <strong>reporte del recorrido del precinto electrónico</strong>.</p>
    <p>Quedamos a su disposición ante cualquier consulta.</p>
    <p>Saludos cordiales,</p>
    <br/>
    <strong>NetoTrack | ESC-group S.R.L.</strong>
    <p>📍 Dirección: C/Bethania No. 13, Nave 13, San Benito, Santo Domingo Oeste</p>
    <p>📞 Tel: 809-372-1028</p>
    <p>📧 Email: info@netotrack.com</p>
    <p>🌐 Web: <a href="https://www.netotrack.com">www.netotrack.com</a></p>
  `;

  await this.mailService.sendWithAttachment({
    to: email,
    subject: `Reporte de recorrido - Dispositivo ${deviceName}`,
    html,
    attachment: {
      filename: `auto-report-${deviceName}.pdf`,
      content: buffer,
      contentType: 'application/pdf',
    },
  });

  // 3. Devolver también el PDF inline en la respuesta HTTP (opcional)
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename=auto-report-${deviceName}.pdf`,
  );
  
  pdfDoc.pipe(res); 
  pdfDoc.end();
}
}
