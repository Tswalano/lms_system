export const Colors = {
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#ffffff',
  cardBorder: '#e5e5e5',
  primary: '#0a0a0a',
  primaryForeground: '#fafafa',
  secondary: '#f5f5f5',
  secondaryForeground: '#0a0a0a',
  muted: '#f5f5f5',
  mutedForeground: '#737373',
  border: '#e5e5e5',
  input: '#e5e5e5',
  destructive: '#ef4444',
  destructiveForeground: '#fafafa',
  success: '#22c55e',
  warning: '#f59e0b',

  // Leave type gradients
  leaveColors: {
    annual: { start: '#f43f5e', end: '#ec4899', light: '#fff1f2' },
    sick: { start: '#06b6d4', end: '#3b82f6', light: '#ecfeff' },
    paternity: { start: '#eab308', end: '#f59e0b', light: '#fefce8' },
    family: { start: '#10b981', end: '#22c55e', light: '#ecfdf5' },
    default: { start: '#8b5cf6', end: '#6366f1', light: '#f5f3ff' },
  },

  // Status colors
  status: {
    approved: { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
    pending: { bg: '#fef9c3', text: '#ca8a04', dot: '#eab308' },
    rejected: { bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
    cancelled: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
  },
} as const;

export type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Paternity Leave' | 'Family Responsibility';

export function getLeaveColor(leaveType: string) {
  const map: Record<string, keyof typeof Colors.leaveColors> = {
    'Annual Leave': 'annual',
    'Sick Leave': 'sick',
    'Paternity Leave': 'paternity',
    'Family Responsibility': 'family',
  };
  return Colors.leaveColors[map[leaveType] ?? 'default'];
}

export function getStatusColor(status: string) {
  return Colors.status[status as keyof typeof Colors.status] ?? Colors.status.pending;
}
