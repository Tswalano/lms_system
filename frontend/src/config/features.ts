/**
 * Feature flags — controlled via VITE_ environment variables.
 * Set to 'true' in .env (dev) and leave unset or 'false' in .env.production.
 *
 * Usage:
 *   import features from '@/config/features';
 *   if (features.adminDocuments) { ... }
 */
const isDev = import.meta.env.DEV;

const features = {
  adminDocuments: isDev || import.meta.env.VITE_FEATURE_ADMIN_DOCUMENTS === 'true',
  employeeDocuments: isDev || import.meta.env.VITE_FEATURE_EMPLOYEE_DOCUMENTS === 'true',
  performanceAdmin: isDev || import.meta.env.VITE_FEATURE_PERFORMANCE_ADMIN === 'true',
  performance: isDev || import.meta.env.VITE_FEATURE_PERFORMANCE === 'true',
} as const;

export type FeatureFlag = keyof typeof features;

export default features;
