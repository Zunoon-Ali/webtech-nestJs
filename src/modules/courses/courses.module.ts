import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course, CourseVersion, Chapter, Prerequisite } from '../../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseVersion, Chapter, Prerequisite])],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
