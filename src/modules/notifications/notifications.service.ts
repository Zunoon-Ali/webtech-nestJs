import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

export interface Notification {
  userId: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
}

/**
 * In-memory notification store (replace with DB table in production iteration).
 * Uses event listeners to receive cross-module events without direct imports.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly store: Notification[] = [];

  private push(userId: string, type: string, title: string, body: string, payload: Record<string, unknown>) {
    const notification: Notification = { userId, type, title, body, payload, createdAt: new Date(), read: false };
    this.store.push(notification);
    this.logger.log(`[Notif] type=${type}, userId=${userId}`);
    return notification;
  }

  getForUser(userId: string) {
    return this.store.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markAllRead(userId: string) {
    this.store.filter(n => n.userId === userId).forEach(n => (n.read = true));
  }

  // ---- Event Listeners ----

  @OnEvent('notification.certificate_issued')
  onCertificate(p: { userId: string; courseTitle: string; pdfUrl: string }) {
    this.push(p.userId, 'certificate_issued', '🎓 Certificate Issued!', `You earned a certificate for "${p.courseTitle}".`, p);
  }

  @OnEvent('notification.deadline_reminder')
  onDeadlineReminder(p: { userId: string; courseTitle: string; daysLeft: number }) {
    const urgency = p.daysLeft <= 1 ? '🚨' : p.daysLeft <= 3 ? '⚠️' : '📅';
    this.push(p.userId, 'deadline_approaching', `${urgency} Compliance Deadline`, `"${p.courseTitle}" is due in ${p.daysLeft} day${p.daysLeft !== 1 ? 's' : ''}.`, p);
  }

  @OnEvent('enrollment.completed')
  onEnrollmentCompleted(p: { managerId: string; employeeName: string; courseTitle: string }) {
    this.push(p.managerId, 'employee_completed', '✅ Employee Completed Training', `${p.employeeName} finished "${p.courseTitle}".`, p);
  }
}
