/**
 * Security headers applied to every response.
 *
 * - CSP locks script/style/connect origins (Supabase allowed for auth + realtime).
 *   `frame-ancestors 'none'` + X-Frame-Options block clickjacking.
 * - HSTS forces HTTPS for a year (incl. subdomains, preloadable).
 * - nosniff, Referrer-Policy and Permissions-Policy reduce leakage / abuse.
 *
 * NOTE: script/style keep 'unsafe-inline' because Next's hydration bootstrap
 * and Tailwind/inline styles require it without a nonce pipeline. Nonce-based
 * strict CSP is the next hardening step.
 */
const isDev = process.env.NODE_ENV !== "production";

/**
 * DEV ONLY: Next compiles every chunk with `devtool: eval-source-map`, and the
 * HMR client evaluates updates the same way. Without 'unsafe-eval' the bundles
 * download normally and then silently fail to execute — the app server-renders
 * but never hydrates, so nothing on the page is interactive. Production builds
 * contain no eval, so the shipped policy stays strict.
 *
 * `upgrade-insecure-requests` is likewise dropped in dev so http://localhost
 * is not rewritten to https.
 */
const csp = [
  "default-src 'self'",
  isDev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  isDev
    ? "connect-src 'self' ws: wss: https://*.supabase.co"
    : "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
