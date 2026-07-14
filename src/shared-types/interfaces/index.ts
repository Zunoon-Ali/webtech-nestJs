import { UserRole, EnrollmentStatus, QuestionType } from '../enums';

export interface IUser {
  id: string;
  companyId: string;
  teamId: string | null;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface ICourse {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  regulatoryDeadline: string | null; // ISO date
  targetDepartmentIds: string[];
  estimatedDurationMinutes: number;
  currentVersionId: string | null;
}

export interface IEnrollment {
  id: string;
  userId: string;
  courseId: string;
  courseVersionId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
}

export interface IQuestion {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  options: string[] | null;
  explanation: string;
  order: number;
}

export interface ICertificate {
  id: string;
  userId: string;
  courseId: string;
  verificationCode: string;
  pdfUrl: string;
  issuedAt: string;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter: Record<string, unknown>): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  softDelete(id: string): Promise<void>;
}

export interface IAiProvider {
  complete(prompt: string, options?: { maxTokens?: number }): Promise<string>;
}
