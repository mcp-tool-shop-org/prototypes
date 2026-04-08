import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware for request handling.
 * Ensures Teams routes have proper headers for iframe embedding.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // Teams routes need special iframe handling
  if (pathname.startsWith("/teams")) {
    // Allow embedding in Teams
    response.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://res.cdn.office.net https://statics.teams.cdn.office.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "frame-ancestors https://teams.microsoft.com https://*.teams.microsoft.com https://*.office.com https://*.sharepoint.com",
        "connect-src 'self' https://gentle-bay-0363a0d10.4.azurestaticapps.net",
      ].join("; ")
    );

    // Remove X-Frame-Options to allow embedding (CSP frame-ancestors takes precedence)
    response.headers.delete("X-Frame-Options");
  }

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes
    "/((?!_next/static|_next/image|favicon.ico|demo/).*)",
  ],
};
