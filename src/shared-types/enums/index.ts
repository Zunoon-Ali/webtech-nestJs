export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  CONTENT_ADMIN = 'content_admin',
  HR_ADMIN = 'hr_admin',
}

export enum EnrollmentStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_QUIZ = 'pending_quiz',
  PASSED = 'passed',
  FAILED = 'failed',
}

export enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export enum QuestionType {
  MCQ = 'mcq',
  SHORT_ANSWER = 'short_answer',
}

export enum ContentType {
  PDF = 'pdf',
  VIDEO = 'video',
  SLIDE = 'slide',
}

export enum RiskLevel {
  GREEN = 'green',
  AMBER = 'amber',
  RED = 'red',
}

export enum AiFeature {
  LEARNING_PATH = 'learning_path',
  QUIZ_GEN = 'quiz_gen',
  GAP_ANALYSIS = 'gap_analysis',
  RISK_ALERT = 'risk_alert',
}
