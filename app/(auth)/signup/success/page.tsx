import { Suspense } from "react"
import SuccessPageContent from "./success-content"

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  )
}
