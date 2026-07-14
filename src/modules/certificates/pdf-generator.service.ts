import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfGeneratorService {
  private readonly outputDir = path.join(process.cwd(), 'public', 'certificates');

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateCertificate(data: {
    certificateId: string;
    employeeName: string;
    courseTitle: string;
    issuedAt: Date;
    verificationCode: string;
  }): Promise<string> {
    const filename = `${data.certificateId}.pdf`;
    const filepath = path.join(this.outputDir, filename);
    const publicUrl = `/certificates/${filename}`;

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f0f4ff');

      // Decorative border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3).stroke('#3b5bdb');

      // Title
      doc.fillColor('#1a1a2e')
        .fontSize(40)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', { align: 'center' })
        .moveDown(0.5);

      // Subtitle
      doc.fillColor('#4a4a6a')
        .fontSize(16)
        .font('Helvetica')
        .text('This is to certify that', { align: 'center' })
        .moveDown(0.3);

      // Employee name
      doc.fillColor('#3b5bdb')
        .fontSize(36)
        .font('Helvetica-Bold')
        .text(data.employeeName, { align: 'center' })
        .moveDown(0.3);

      // Course title
      doc.fillColor('#4a4a6a')
        .fontSize(16)
        .font('Helvetica')
        .text('has successfully completed', { align: 'center' })
        .moveDown(0.3);

      doc.fillColor('#1a1a2e')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text(data.courseTitle, { align: 'center' })
        .moveDown(1);

      // Date
      doc.fillColor('#4a4a6a')
        .fontSize(14)
        .font('Helvetica')
        .text(`Issued on: ${data.issuedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, { align: 'center' })
        .moveDown(0.5);

      // Verification code
      doc.fillColor('#888')
        .fontSize(10)
        .text(`Verification Code: ${data.verificationCode}`, { align: 'center' })
        .text(`Verify at: /api/v1/certificates/verify/${data.verificationCode}`, { align: 'center' });

      doc.end();

      stream.on('finish', () => resolve(publicUrl));
      stream.on('error', reject);
    });
  }
}
