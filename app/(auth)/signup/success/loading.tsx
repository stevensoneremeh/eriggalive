import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-12 text-center">
          <div className="w-32 h-32 bg-muted animate-pulse rounded-full mx-auto mb-8"></div>
          <div className="h-8 bg-muted animate-pulse rounded mb-4"></div>
          <div className="h-4 bg-muted animate-pulse rounded mb-8 max-w-md mx-auto"></div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
            <div className="h-32 bg-muted animate-pulse rounded-xl"></div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="h-10 bg-muted animate-pulse rounded px-8"></div>
            <div className="h-10 bg-muted animate-pulse rounded px-8"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
