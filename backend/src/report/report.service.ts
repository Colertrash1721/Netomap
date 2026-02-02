import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { createPdf } from './pdfmaker';
import { CreateReportDTO } from './DTO/create-report.DTO';
import { Events } from 'src/traccar/entities/events.entity';
import { InjectRepository } from '@nestjs/typeorm/dist';
import { RoutesService } from 'src/routes/routes.service';
import { Repository } from 'typeorm';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Events) private readonly eventRepo: Repository<Events>,
    private readonly routesService: RoutesService,
  ) { }

  async createReport(reportData: CreateReportDTO, files: any): Promise<PDFKit.PDFDocument> {
    console.log("📦 Archivos recibidos en el backend:", files);
    
    const processImage = (file: Express.Multer.File) => {
        if (!file) return null;
        return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    };

    // Verificar estructura real de files
    console.log("Estructura completa de files:", JSON.stringify(files, null, 2));

    // Manejar imágenes de forma más robusta
    const images = {
        colocacion: files.colocacion?.[0] ? processImage(files.colocacion[0]) : null,
        apertura: files.apertura?.[0] ? processImage(files.apertura[0]) : null,
    };

    console.log("Imágenes procesadas:", {
        colocacion: images.colocacion ? "Presente" : "Ausente",
        apertura: images.apertura ? "Presente" : "Ausente"
    });


    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'REPORTE DE RECORRIDO DEL PRECINTO ELECTRÓNICO\n\n', style: 'header' },

        {
          text: `Dispositivo: ${reportData.device || '-'}\n\nFecha de salida: ${reportData.salida || '-'}\n\nConductor: ${reportData.conductor || '-'}\n\nUnidad de transporte: ${reportData.unidad || '-'}\n\nResponsable de instalación: ${reportData.responsable || '-'}\n\nFecha de llegada: ${reportData.llegada || '-'}\n\nFecha de apertura: ${reportData.apertura || '-'}\n\nRecepcionista: ${reportData.recepcionista || '-'}\n\nDetalles del viaje: ${reportData.detalles || '-'}\n\n`,
          style: 'sectionText',
        },
        
        {
          text: '\nFirmas',
          style: 'subheader',
        },
        {
          columns: [
            {
              text: 'Firma del Transportista:\n\n ___________________________',
              alignment: 'left',
              margin: [0, 100, 0, 0],
            },
            {
              text: 'Firma del Recepcionista:\n\n ___________________________',
              alignment: 'right',
              margin: [0, 100, 0, 0],
            },
          ],
        },
        {
          text: '\nFirma del Destinatario:\n\n ___________________________',
          alignment: 'center',
          margin: [0, 60, 0, 0],
        },
      ],
      footer: {
        columns: [
          {
            text: 'ESC-Group S.R.L. | www.esc-group.com | info@esc-group.com\nCalle Bethania #21, Santo Domingo, República Dominicana',
            alignment: 'center',
            fontSize: 8,
            margin: [0, 10, 0, 0],
            color: 'gray',
          },
        ],
      },
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 4] },
        sectionText: { margin: [0, 0, 0, 10] },
      },
    };

    return createPdf(docDefinition);
  }

  private formatDate(date: Date | string | number, locale = 'es-DO') {
    try {
      const d = new Date(date);
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(d);
    } catch {
      return String(date ?? '');
    }
  }

  async createAutoReport(deviceName: string): Promise<PDFKit.PDFDocument> {
    if (!deviceName) {
      throw new HttpException('deviceName es requerido', HttpStatus.BAD_REQUEST);
    }

    // Ruta por nombre de dispositivo
    const route = await this.routesService.findRouteByDeviceName(deviceName);
    if (!route) {
      console.log("No se encontro ruta");
      
      throw new HttpException(
        `No se encontró ruta para el dispositivo "${deviceName}"`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Eventos del dispositivo
    const events = await this.eventRepo.find({
      where: { deviceName },
      order: { eventDate: 'ASC' },
    });

    // Filas de tabla
    const tableBody = [
      [{ text: 'ID Evento', bold: true }, { text: 'Tipo', bold: true }, { text: 'Fecha', bold: true }],
      ...events.map(e => ([
        String(e.idEvent ?? ''),
        e.eventType ?? '-',
        this.formatDate(e.eventDate),
      ])),
    ];

    const now = new Date();

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'REPORTE AUTOMÁTICO DE EVENTOS\n\n', style: 'header' },

        {
          columns: [
            { text: `Fecha creación del reporte: ${this.formatDate(now)}` },
            { text: `Dispositivo: ${deviceName}`, alignment: 'right' },
          ],
        },
        { text: `Fecha de creación de la ruta: ${this.formatDate(route.creationDate)}\n\n`, margin: [0, 4, 0, 12] },

        { text: 'Eventos del dispositivo', style: 'subheader' },
        {
          table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto'],
            body: tableBody,
          },
          layout: 'lightHorizontalLines',
          margin: [0, 8, 0, 16],
        },
      ],
      footer: {
        columns: [
          {
            text:
              'ESC-Group S.R.L. | www.esc-group.com | info@esc-group.com\n' +
              'Calle Bethania #21, Santo Domingo, República Dominicana',
            alignment: 'center',
            fontSize: 8,
            margin: [0, 10, 0, 0],
            color: 'gray',
          },
        ],
      },
      styles: {
        header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
        subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 6] },
      },
      defaultStyle: { fontSize: 10 },
    };

    const deleteEvent = this.eventRepo.delete({ deviceName });
    console.log("Eventos eliminados:", deleteEvent);
    
    return createPdf(docDefinition);
  }

}
