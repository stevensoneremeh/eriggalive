import { getEnvName, isClientProduction } from "./env-config"

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 500,
    public code?: string,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function logError(error: unknown, context?: string) {
  const env = getEnvName()
  const isProduction = isClientProduction()

  if (!isProduction) {
    console.error(`[${context || "Error"}]:`, error)
  }

  // In production, you might want to send to an error tracking service
  if (isProduction && typeof window !== "undefined") {
    // Send to error tracking service (e.g., Sentry)
    // sentry.captureException(error)
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "An unexpected error occurred"
}

export function handleApiError(error: unknown) {
  const message = getErrorMessage(error)
  const statusCode = error instanceof AppError ? error.statusCode : 500

  logError(error, "API")

  return {
    error: message,
    statusCode,
  }
}
