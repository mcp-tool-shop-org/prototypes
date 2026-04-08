import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  /**
   * Security headers configuration.
   * Allows embedding in Microsoft Teams while maintaining security.
   */
  async headers() {
    return [
      {
        // Apply to Teams routes - allow iframe embedding
        source: "/teams/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://res.cdn.office.net https://statics.teams.cdn.office.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "frame-ancestors https://teams.microsoft.com https://*.teams.microsoft.com https://*.office.com https://*.sharepoint.com",
              "connect-src 'self' https://gentle-bay-0363a0d10.4.azurestaticapps.net",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM https://teams.microsoft.com",
          },
        ],
      },
      {
        // Default security for non-Teams routes
        source: "/((?!teams).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "frame-ancestors 'self'",
              "connect-src 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
