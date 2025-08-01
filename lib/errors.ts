
export const ApiErrorCodes = {
  // Client-side errors (4xx)
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  EMAIL_IN_USE: 'EMAIL_IN_USE',
  USERNAME_TAKEN: 'USERNAME_TAKEN',

  // Server-side errors (5xx)
  USER_CREATION_FAILED: 'USER_CREATION_FAILED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EMAIL_SERVICE_FAILURE: 'EMAIL_SERVICE_FAILURE',
  JWT_SECRET_MISSING: 'JWT_SECRET_MISSING',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
} as const;



export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}