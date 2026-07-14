import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CertificatesService } from './certificates.service';

@Injectable()
export class CertificateIssuedListener {
  constructor(private readonly certificatesService: CertificatesService) {}

  /**
   * Listens for the 'certificate.requested' event fired by QuizzesService on a passing attempt.
   * Decoupled from the HTTP request/response cycle — quiz submission returns immediately.
   */
  @OnEvent('certificate.requested', { async: true })
  async handleCertificateRequested(payload: { userId: string; quizAttemptId: string }) {
    try {
      await this.certificatesService.generateAndSave(payload.userId, payload.quizAttemptId);
    } catch (err) {
      // Log but don't crash — certificate can be retried later
      console.error('[CertificateListener] Failed to generate certificate:', err);
    }
  }
}
