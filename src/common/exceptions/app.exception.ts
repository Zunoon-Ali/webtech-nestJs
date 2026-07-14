import { HttpException } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(public code: string, message: string, statusCode: number) {
    super({ code, message }, statusCode);
  }
}

export class AuthInvalidCredentialsException extends AppException {
  constructor() {
    super('AUTH_INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }
}

export class AuthTokenExpiredException extends AppException {
  constructor() {
    super('AUTH_TOKEN_EXPIRED', 'Access token has expired', 401);
  }
}

export class AuthRefreshInvalidException extends AppException {
  constructor() {
    super('AUTH_REFRESH_INVALID', 'Refresh token is invalid or has been reused', 401);
  }
}

export class ForbiddenRoleException extends AppException {
  constructor() {
    super('FORBIDDEN_ROLE', 'You do not have the required permissions to access this resource', 403);
  }
}

export class CourseNotFoundException extends AppException {
  constructor(id: string) {
    super('COURSE_NOT_FOUND', `Course with id ${id} was not found`, 404);
  }
}

export class EnrollmentDuplicateException extends AppException {
  constructor() {
    super('ENROLLMENT_DUPLICATE', 'You are already enrolled in this course', 409);
  }
}

export class QuizAttemptsExceededException extends AppException {
  constructor() {
    super('QUIZ_ATTEMPTS_EXCEEDED', 'Maximum quiz attempts exceeded. Needs manager override', 409);
  }
}

export class AiProviderTimeoutException extends AppException {
  constructor() {
    super('AI_PROVIDER_TIMEOUT', 'AI provider timed out', 502);
  }
}

export class ValidationFailedException extends AppException {
  constructor(details: any) {
    super('VALIDATION_FAILED', 'Validation failed', 400);
    // Overriding response to include details array
    this.getResponse = () => ({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      details,
    });
  }
}
