export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/plans/:path*",
    "/api/plans/:path*",
    "/api/generate-plan",
    "/api/quick-start-phase",
    "/api/refine-plan-section"
  ]
};
