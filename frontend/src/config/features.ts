/**
 * Feature flags — controlled via VITE_ environment variables.
 * Set to 'true' in .env (dev) and leave unset or 'false' in .env.production.
 *
 * Usage:
 *   import features from '@/config/features';
 *   if (features.adminDocuments) { ... }
 */
const isDevEnabled = import.meta.env.DEV || import.meta.env.MODE === 'dev';

const flag = (key: string): boolean =>
  isDevEnabled || import.meta.env[key] === 'true';

const features = {
  adminDocuments: flag('VITE_FEATURE_ADMIN_DOCUMENTS'),
  employeeDocuments: flag('VITE_FEATURE_EMPLOYEE_DOCUMENTS'),
  performanceAdmin: flag('VITE_FEATURE_PERFORMANCE_ADMIN'),
  performance: flag('VITE_FEATURE_PERFORMANCE'),
} as const;

export type FeatureFlag = keyof typeof features;
export default features;