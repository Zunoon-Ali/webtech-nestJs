import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { CertificateIssuedListener } from './certificate-issued.listener';
import { Certificate, QuizAttempt, User, Course } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Certificate, QuizAttempt, User, Course])],
  controllers: [CertificatesController],
  providers: [CertificatesService, PdfGeneratorService, CertificateIssuedListener],
  exports: [CertificatesService],
})
export class CertificatesModule {}
