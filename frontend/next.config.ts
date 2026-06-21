import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: 'spotbot',
  project: 'spotbot-frontend',

  // Upload source maps to Sentry for readable stack traces
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,

  // Automatically tree-shake Sentry logger in production
  automaticVercelMonitors: false,
});
