
export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-96 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
