import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';
import {
  Company, Department, Team, User, Course, CourseVersion, Chapter,
  Prerequisite, Enrollment, Progress, Quiz, Question, QuizAttempt,
  Answer, Certificate, ComplianceDeadline, AiRequestLog,
} from './entities';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'skillforge',
  password: process.env.DB_PASS || 'changeme',
  database: process.env.DB_NAME || 'skillforge',
  entities: [
    Company, Department, Team, User, Course, CourseVersion, Chapter,
    Prerequisite, Enrollment, Progress, Quiz, Question, QuizAttempt,
    Answer, Certificate, ComplianceDeadline, AiRequestLog,
  ],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: true,
});