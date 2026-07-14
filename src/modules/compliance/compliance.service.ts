import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ComplianceDeadline, Enrollment, Team, User } from '../../database/entities';
import { EnrollmentStatus } from '../../shared-types';
import { CreateComplianceDeadlineDto } from './dto/compliance.dto';

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(
    @InjectRepository(ComplianceDeadline) private deadlineRepo: Repository<ComplianceDeadline>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createDeadline(dto: CreateComplianceDeadlineDto) {
    const deadline = this.deadlineRepo.create({
      courseId: dto.courseId,
      departmentId: dto.departmentId || null,
      deadlineDate: dto.deadlineDate,
    });
    return this.deadlineRepo.save(deadline);
  }

  async getDeadlines(departmentId?: string) {
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    return this.deadlineRepo.find({
      where,
      relations: { course: true, department: true },
    });
  }

  async getTeamComplianceReport(teamId: string) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: { members: true },
    });
    if (!team) throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: `Team ${teamId} not found` });

    // Deadlines targeting team's department or company-wide (null)
    const deadlines = await this.deadlineRepo.find({
      where: [
        { departmentId: team.departmentId },
        { departmentId: IsNull() }
      ],
      relations: { course: true },
    });

    const report: any[] = [];

    for (const deadline of deadlines) {
      const memberResults: any[] = [];
      for (const member of team.members) {
        const enrollment = await this.enrollmentRepo.findOne({
          where: { userId: member.id, courseId: deadline.courseId },
        });
        memberResults.push({
          userId: member.id,
          name: `${member.firstName} ${member.lastName}`,
          status: enrollment?.status ?? 'not_enrolled',
          completedAt: enrollment?.completedAt ?? null,
          onTime: enrollment?.completedAt ? new Date(enrollment.completedAt) <= new Date(deadline.deadlineDate) : false,
        });
      }

      const passedCount = memberResults.filter(m => m.status === EnrollmentStatus.PASSED).length;
      report.push({
        deadline,
        complianceRate: team.members.length > 0 ? (passedCount / team.members.length) * 100 : 0,
        members: memberResults,
      });
    }

    return report;
  }

  /**
   * Runs every day at 08:00 — fires notification events for approaching deadlines.
   * Does NOT import or call NotificationsService directly (event-driven decoupling).
   */
  @Cron('0 8 * * *')
  async checkDeadlinesAndNotify() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const urgentDeadlines = await this.deadlineRepo.find({
      where: { deadlineDate: LessThanOrEqual(sevenDaysStr) },
      relations: {
        course: true,
        department: {
          teams: {
            members: true,
          },
        },
      },
    });

    for (const deadline of urgentDeadlines) {
      let targetUsers: User[] = [];

      if (deadline.department) {
        // Collect users in this department
        for (const team of deadline.department.teams || []) {
          targetUsers.push(...(team.members || []));
        }
      } else {
        // Company-wide: fetch all active users
        targetUsers = await this.userRepo.find({ where: { isActive: true } });
      }

      for (const member of targetUsers) {
        const enrollment = await this.enrollmentRepo.findOne({
          where: { userId: member.id, courseId: deadline.courseId },
        });
        const isPassed = enrollment?.status === EnrollmentStatus.PASSED;
        if (!isPassed) {
          const deadlineTime = new Date(deadline.deadlineDate).getTime();
          const daysLeft = Math.ceil((deadlineTime - Date.now()) / (1000 * 60 * 60 * 24));
          this.eventEmitter.emit('notification.deadline_reminder', {
            userId: member.id,
            courseTitle: deadline.course?.title || 'Required Course',
            dueDate: deadline.deadlineDate,
            daysLeft,
          });
          this.logger.log(`[Compliance] Deadline reminder sent: userId=${member.id}, course=${deadline.course?.title}, daysLeft=${daysLeft}`);
        }
      }
    }
  }
}
