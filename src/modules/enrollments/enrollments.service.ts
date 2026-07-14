import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Enrollment, Course, CourseVersion, Progress, User, Team } from '../../database/entities';
import { EnrollmentStatus, ProgressStatus } from '../../shared-types';
import { EnrollmentDuplicateException } from '../../common/exceptions/app.exception';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(Progress) private progressRepo: Repository<Progress>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    private eventEmitter: EventEmitter2,
  ) {}

  async selfEnroll(userId: string, courseId: string) {
    // Check for duplicate enrollment
    const existing = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
    if (existing) throw new EnrollmentDuplicateException();

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: `Course ${courseId} not found` });
    if (!course.currentVersionId) throw new NotFoundException({ code: 'COURSE_VERSION_NOT_FOUND', message: 'Course has no active version' });

    const enrollment = this.enrollmentRepo.create({
      userId,
      courseId,
      courseVersionId: course.currentVersionId,
      enrolledBy: 'self',
      status: EnrollmentStatus.NOT_STARTED,
    });
    return this.enrollmentRepo.save(enrollment);
  }

  async bulkEnroll(managerId: string, courseId: string, teamId: string) {
    const team = await this.teamRepo.findOne({ where: { id: teamId }, relations: { members: true } });
    if (!team) throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: `Team ${teamId} not found` });

    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course || !course.currentVersionId) throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: 'Course or version not found' });

    const results: Enrollment[] = [];
    for (const member of team.members) {
      const existing = await this.enrollmentRepo.findOne({ where: { userId: member.id, courseId } });
      if (!existing) {
        const enrollment = await this.enrollmentRepo.save(this.enrollmentRepo.create({
          userId: member.id,
          courseId,
          courseVersionId: course.currentVersionId,
          enrolledBy: 'manager',
          status: EnrollmentStatus.NOT_STARTED,
        }));
        results.push(enrollment);
      }
    }
    return { enrolled: results.length, total: team.members.length };
  }

  async getMyEnrollments(userId: string) {
    return this.enrollmentRepo.find({
      where: { userId },
      relations: { course: true, courseVersion: true },
      order: { enrolledAt: 'DESC' },
    });
  }

  async getTeamEnrollments(teamId: string, query: { page: number; limit: number }) {
    const { page = 1, limit = 20 } = query;
    const team = await this.teamRepo.findOne({ where: { id: teamId }, relations: { members: true } });
    if (!team) throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: `Team ${teamId} not found` });
    const memberIds = team.members.map(m => m.id);
    if (!memberIds.length) return { data: [], meta: { page, limit, total: 0 } };

    const [data, total] = await this.enrollmentRepo.createQueryBuilder('e')
      .where('e.userId IN (:...memberIds)', { memberIds })
      .leftJoinAndSelect('e.course', 'course')
      .leftJoinAndSelect('e.user', 'user')
      .skip((page - 1) * limit).take(limit)
      .getManyAndCount();

    return { data, meta: { page, limit, total } };
  }

  async updateProgress(enrollmentId: string, userId: string, chapterId: string, status: ProgressStatus) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id: enrollmentId, userId }, relations: { course: true } });
    if (!enrollment) throw new NotFoundException({ code: 'ENROLLMENT_NOT_FOUND', message: 'Enrollment not found' });

    // Upsert progress
    let progress = await this.progressRepo.findOne({ where: { enrollmentId, chapterId } });
    if (!progress) {
      progress = this.progressRepo.create({ enrollmentId, chapterId, status });
    } else {
      progress.status = status;
    }
    await this.progressRepo.save(progress);

    // Check if all chapters are completed → advance enrollment to pending_quiz
    await this.recalculateEnrollmentStatus(enrollment);

    return progress;
  }

  private async recalculateEnrollmentStatus(enrollment: Enrollment) {
    // Get all chapters for the course version
    const allProgress = await this.progressRepo.find({ where: { enrollmentId: enrollment.id } });
    const allCompleted = allProgress.length > 0 && allProgress.every(p => p.status === ProgressStatus.COMPLETED);

    if (allCompleted && enrollment.status === EnrollmentStatus.IN_PROGRESS) {
      await this.enrollmentRepo.update(enrollment.id, { status: EnrollmentStatus.PENDING_QUIZ });

      // Emit event for manager notification if mandatory course
      if (enrollment.course?.isMandatory) {
        const user = await this.userRepo.findOne({ where: { id: enrollment.userId } });
        if (user?.teamId) {
          const team = await this.teamRepo.findOne({ where: { id: user.teamId } });
          if (team?.managerId) {
            this.eventEmitter.emit('enrollment.completed', {
              employeeId: user.id,
              employeeName: `${user.firstName} ${user.lastName}`,
              courseId: enrollment.courseId,
              courseTitle: enrollment.course.title,
              completedAt: new Date().toISOString(),
              managerId: team.managerId,
            });
          }
        }
      }
    } else if (enrollment.status === EnrollmentStatus.NOT_STARTED && allProgress.length > 0) {
      await this.enrollmentRepo.update(enrollment.id, { status: EnrollmentStatus.IN_PROGRESS });
    }
  }
}
