import type { NextRequest } from "next/server"
import { redirect } from "next/navigation"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const reference = searchParams.get("reference")
  const status = searchParams.get("status")

  if (!reference) {
    return redirect("/payments/error?message=Missing payment reference")
  }

  if (status === "success") {
    return redirect(`/payments/success?reference=${reference}`)
  } else {
    return redirect(`/payments/error?reference=${reference}&message=Payment was not completed`)
  }
}
