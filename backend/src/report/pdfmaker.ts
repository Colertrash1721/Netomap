import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as path from 'path';

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica',
  },
};

const printer = new PdfPrinter(fonts);

export function createPdf(docDefinition: TDocumentDefinitions): PDFKit.PDFDocument {
  return printer.createPdfKitDocument(docDefinition);
}
