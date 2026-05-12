/**
 * Feature flags — controlled via VITE_ environment variables.
 * Set to 'true' in .env (dev) and leave unset or 'false' in .env.production.
 *
 * Usage:
 *   import features from '@/config/features';
 *   if (features.adminDocuments) { ... }
 */
const features = {
  adminDocuments: import.meta.env.VITE_FEATURE_ADMIN_DOCUMENTS === 'true',
  employeeDocuments: import.meta.env.VITE_FEATURE_EMPLOYEE_DOCUMENTS === 'true',
  performanceAdmin: import.meta.env.VITE_FEATURE_PERFORMANCE_ADMIN === 'true',
  performance: import.meta.env.VITE_FEATURE_PERFORMANCE === 'true',
} as const;

export type FeatureFlag = keyof typeof features;

export default features;
