const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {isDemoMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode:</strong> This app is running with mock data. Configure Supabase environment variables
                for full functionality.
              </p>
            </div>
          </div>
        </div>
      )}
      <div>
        <h1>Welcome to my app!</h1>
        <p>This is a basic Next.js app.</p>
      </div>
    </main>
  )
}
