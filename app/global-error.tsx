"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">Something went wrong!</h1>
          <p className="text-muted-foreground mb-8">An unexpected error occurred.</p>
          <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
