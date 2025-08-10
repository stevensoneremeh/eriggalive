import { authMiddleware } from "@clerk/nextjs"

export default authMiddleware({
  // Routes that can be accessed while signed out
  publicRoutes: [
    "/",
    "/about",
    "/api/health(.*)",
    "/api/health/simple",
    "/api/health/system",
    "/erigga(.*)",
    "/images(.*)",
    "/placeholder(.*)",
  ],
  // Routes that can always be accessed, and have
  // no authentication information
  ignoredRoutes: [
    "/api/health(.*)",
    "/_next(.*)",
    "/favicon.ico",
    "/images(.*)",
    "/videos(.*)",
    "/fonts(.*)",
    "/placeholder(.*)",
    "/erigga(.*)",
    "/((?!.*\\..*|_next).*)",
  ],
})

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}
