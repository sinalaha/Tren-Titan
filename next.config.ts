import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "connect-src 'self' https:",
      "frame-ancestors 'self'"
    ].join("; ")
  }
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60
  },
  async redirects() {
    return [
      { source: "/scan", destination: "/dashboard/nutrition/scan", permanent: false },
      { source: "/nutrition", destination: "/dashboard/nutrition/scan", permanent: false },
      { source: "/nutrition/scan", destination: "/dashboard/nutrition/scan", permanent: false },
      { source: "/training", destination: "/dashboard/training/log", permanent: false },
      { source: "/training/log", destination: "/dashboard/training/log", permanent: false },
      { source: "/coach", destination: "/dashboard/coach", permanent: false }
    ];
  },
  async headers() {
    const base = [{ source: "/(.*)", headers: securityHeaders }];
    if (process.env.NODE_ENV === "production") {
      return [
        ...base,
        {
          source: "/(.*)",
          headers: [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload"
            }
          ]
        }
      ];
    }
    return base;
  }
};

export default nextConfig;
