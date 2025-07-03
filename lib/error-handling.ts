// Production-ready error handling utilities

// Log errors to console in development, could be extended to use a service like Sentry in production
export function logError(error: unknown, context?: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined

  if (process.env.NODE_ENV === "development") {
    console.error(`[${context || "ERROR"}]`, errorMessage, errorStack)
  } else {
    // In production, we could send this to a logging service
    console.error(`[${context || "ERROR"}]`, errorMessage)

    // Here you could add integration with error monitoring services like Sentry
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }
}

// User-friendly error handler that doesn't expose sensitive information in production
export function getUserFriendlyError(error: unknown): string {
  if (process.env.NODE_ENV === "development") {
    return error instanceof Error ? error.message : String(error)
  }

  // In production, return generic messages based on error types
  if (error instanceof Error) {
    if (error.message.includes("auth")) {
      return "Authentication error. Please try signing in again."
    } else if (error.message.includes("permission") || error.message.includes("access")) {
      return "You don't have permission to perform this action."
    } else if (error.message.includes("network") || error.message.includes("connection")) {
      return "Network error. Please check your connection and try again."
    }
  }

  return "Something went wrong. Please try again later."
}
