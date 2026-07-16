export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "SLOT_UNAVAILABLE"
  | "OVERBOOKING"
  | "SETUP_ALREADY_COMPLETED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: AppErrorCode,
    message: string,
    statusCode = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError("VALIDATION_ERROR", message, 400, details);
  }

  static notFound(message: string): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }

  static unauthorized(message = "Não autorizado."): AppError {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Acesso negado."): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  static conflict(message: string): AppError {
    return new AppError("CONFLICT", message, 409);
  }

  static slotUnavailable(message = "Horário indisponível."): AppError {
    return new AppError("SLOT_UNAVAILABLE", message, 409);
  }

  static overbooking(message = "Conflito de horário detectado."): AppError {
    return new AppError("OVERBOOKING", message, 409);
  }

  static internal(message = "Erro interno do servidor."): AppError {
    return new AppError("INTERNAL_ERROR", message, 500);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocorreu um erro inesperado.";
}
