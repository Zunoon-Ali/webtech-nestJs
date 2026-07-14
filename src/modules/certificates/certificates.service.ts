import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { Certificate, QuizAttempt, User, Course } from '../../database/entities';
import { PdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate) private certRepo: Repository<Certificate>,
    @InjectRepository(QuizAttempt) private attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    private pdfGenerator: PdfGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  async generateAndSave(userId: string, quizAttemptId: string) {
    // Avoid duplicate certificates for same attempt
    const existing = await this.certRepo.findOne({ where: { quizAttemptId } });
    if (existing) return existing;

    const attempt = await this.attemptRepo.findOne({
      where: { id: quizAttemptId },
      relations: { quiz: { courseVersion: { course: true } } },
    });
    if (!attempt) throw new NotFoundException({ code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found for certificate' });

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found for certificate' });

    const courseTitle = attempt.quiz?.courseVersion?.course?.title ?? 'Unknown Course';
    const verificationCode = randomUUID();
    const issuedAt = new Date();

    // First save to get the ID
    const cert = this.certRepo.create({
      userId,
      courseId: attempt.quiz?.courseVersion?.courseId,
      quizAttemptId,
      verificationCode,
      issuedAt,
    });
    const saved = await this.certRepo.save(cert);

    // Generate PDF
    const pdfUrl = await this.pdfGenerator.generateCertificate({
      certificateId: saved.id,
      employeeName: `${user.firstName} ${user.lastName}`,
      courseTitle,
      issuedAt,
      verificationCode,
    });

    await this.certRepo.update(saved.id, { pdfUrl });
    saved.pdfUrl = pdfUrl;

    // Emit notification event
    this.eventEmitter.emit('notification.certificate_issued', {
      userId,
      certificateId: saved.id,
      courseTitle,
      pdfUrl,
    });

    return saved;
  }

  async findAllForUser(userId: string) {
    return this.certRepo.find({ where: { userId }, relations: { course: true } });
  }

  async verifyCertificate(code: string) {
    const cert = await this.certRepo.findOne({ where: { verificationCode: code }, relations: { user: true, course: true } });
    if (!cert) throw new NotFoundException({ code: 'CERTIFICATE_NOT_FOUND', message: 'Certificate not found or invalid code' });
    return {
      valid: true,
      employeeName: `${cert.user?.firstName} ${cert.user?.lastName}`,
      courseTitle: cert.course?.title,
      issuedAt: cert.issuedAt,
    };
  }

  async getById(id: string) {
    const cert = await this.certRepo.findOne({ where: { id }, relations: { course: true, user: true } });
    if (!cert) throw new NotFoundException({ code: 'CERTIFICATE_NOT_FOUND', message: 'Certificate not found' });
    return cert;
  }
}
