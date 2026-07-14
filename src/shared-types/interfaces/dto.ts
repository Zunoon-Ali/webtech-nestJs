import { IUser, ICourse } from './index';
import { QuestionType } from '../enums';

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  isMandatory: boolean;
  regulatoryDeadline?: string;
  targetDepartmentIds: string[];
  estimatedDurationMinutes: number;
}

export interface SubmitQuizAttemptDto {
  answers: { questionId: string; submittedAnswer: string }[];
}

export interface QuizAttemptResultDto {
  attemptId: string;
  scorePercent: number;
  passed: boolean;
  attemptsRemaining: number;
  certificateId: string | null;
}

export interface LearningPathRequestDto {
  currentRole: string;
  department: string;
  careerGoal: string;
}

export interface LearningPathItemDto {
  courseId: string;
  title: string;
  rationale: string;
  estimatedMinutes: number;
}

export interface LearningPathResponseDto {
  items: LearningPathItemDto[];
  totalEstimatedMinutes: number;
  usedFallback: boolean;
}

export interface QuizGenerateRequestDto {
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeneratedQuestionDto {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GapAnalysisRequestDto {
  teamId: string;
  frameworkId: string;
}

export interface GapAnalysisItemDto {
  userId: string;
  covered: string[];
  partiallyCovered: string[];
  missing: string[];
  priorityScore: number;
}
