import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import configuration from './config/configuration';
import {
  Company, Department, Team, User, Course, CourseVersion, Chapter,
  Prerequisite, Enrollment, Progress, Quiz, Question, QuizAttempt,
  Answer, Certificate, ComplianceDeadline, AiRequestLog,
} from './database/entities';

import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { AiProxyModule } from './modules/ai-proxy/ai-proxy.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [
          Company, Department, Team, User, Course, CourseVersion, Chapter,
          Prerequisite, Enrollment, Progress, Quiz, Question, QuizAttempt,
          Answer, Certificate, ComplianceDeadline, AiRequestLog,
        ],
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    CompaniesModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    QuizzesModule,
    CertificatesModule,
    ComplianceModule,
    AiProxyModule,
    NotificationsModule,
    WebsocketModule,
  ],
})
export class AppModule {}
