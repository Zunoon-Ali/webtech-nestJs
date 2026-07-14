import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course, CourseVersion, Chapter, Prerequisite } from '../../database/entities';
import { CreateCourseDto, CreateChapterDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseVersion) private versionRepo: Repository<CourseVersion>,
    @InjectRepository(Chapter) private chapterRepo: Repository<Chapter>,
    @InjectRepository(Prerequisite) private prereqRepo: Repository<Prerequisite>,
  ) {}

  async findAll(query: { mandatory?: boolean; departmentId?: string; page?: number; limit?: number }) {
    const { mandatory, departmentId, page = 1, limit = 20 } = query;
    const qb = this.courseRepo.createQueryBuilder('course')
      .leftJoinAndSelect('course.currentVersion', 'cv');

    if (mandatory !== undefined) qb.andWhere('course.isMandatory = :mandatory', { mandatory });

    const [data, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { data, meta: { page, limit, total } };
  }

  async findById(id: string) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: { currentVersion: true, prerequisites: true },
    });
    if (!course) throw new NotFoundException({ code: 'COURSE_NOT_FOUND', message: `Course ${id} not found` });
    return course;
  }

  async create(dto: CreateCourseDto, createdBy: string) {
    const course = this.courseRepo.create({ ...dto, createdBy });
    return this.courseRepo.save(course);
  }

  async update(id: string, dto: Partial<CreateCourseDto>) {
    await this.findById(id);
    await this.courseRepo.update(id, dto);
    return this.findById(id);
  }

  async softDelete(id: string) {
    await this.findById(id);
    // Soft delete by unsetting active flag on current version
    await this.courseRepo.update(id, { currentVersionId: null });
  }

  // Versions
  async addVersion(courseId: string, contentUrl: string) {
    const course = await this.findById(courseId);
    const lastVersion = await this.versionRepo.count({ where: { courseId } });
    const version = this.versionRepo.create({
      courseId,
      versionNumber: lastVersion + 1,
      contentUrl,
      isActive: true,
    });
    const saved = await this.versionRepo.save(version);
    await this.courseRepo.update(courseId, { currentVersionId: saved.id });
    return saved;
  }

  // Prerequisites
  async addPrerequisite(courseId: string, requiredCourseId: string) {
    if (courseId === requiredCourseId) throw new ConflictException({ code: 'CIRCULAR_PREREQUISITE', message: 'A course cannot require itself' });
    const existing = await this.prereqRepo.findOne({ where: { courseId, requiredCourseId } });
    if (existing) return existing;
    return this.prereqRepo.save(this.prereqRepo.create({ courseId, requiredCourseId }));
  }

  // Chapters
  async getChapters(courseId: string) {
    const course = await this.findById(courseId);
    if (!course.currentVersionId) return [];
    return this.chapterRepo.find({
      where: { courseVersionId: course.currentVersionId },
      order: { order: 'ASC' },
    });
  }

  async addChapter(courseId: string, dto: CreateChapterDto) {
    const course = await this.findById(courseId);
    if (!course.currentVersionId) throw new NotFoundException({ code: 'COURSE_VERSION_NOT_FOUND', message: 'Course has no active version yet' });
    const chapter = this.chapterRepo.create({ ...dto, courseVersionId: course.currentVersionId });
    return this.chapterRepo.save(chapter);
  }
}
