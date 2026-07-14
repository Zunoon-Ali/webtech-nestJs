import { ValidationPipe as NestValidationPipe, ValidationError } from '@nestjs/common';
import { ValidationFailedException } from '../exceptions/app.exception';

export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const formatError = (error: ValidationError): any => {
          if (error.children && error.children.length > 0) {
            return error.children.map(formatError).flat();
          }
          return {
            field: error.property,
            errors: Object.values(error.constraints || {}),
          };
        };

        const formattedErrors = errors.map(formatError).flat();
        return new ValidationFailedException(formattedErrors);
      },
    });
  }
}