// validation-error.middleware.ts

import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator';

@Injectable()
export class ValidationErrorMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const err = res.locals.error; // Поддерживается, если вы устанавливаете res.locals.error где-то раньше

    if (
      err instanceof Array &&
      err.every((e) => e instanceof ValidationError)
    ) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation error',
        errors: this.formatValidationErrors(err),
      });
    }

    next(); // Вызывайте next без аргументов
  }

  private formatValidationErrors(errors: ValidationError[]) {
    return errors.map((error) => {
      const constraints = error.constraints;
      const property = error.property;

      return {
        property,
        constraints,
      };
    });
  }
}
