import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors, getLeaveColor } from '../theme/colors';
import { StatusBadge } from './StatusBadge';

export interface LeaveRecord {
  id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  duration: number;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  leave_comment: string;
  feedback?: string;
  leave_length: 'half_day' | 'full_day';
  createdAt: string;
}

interface Props {
  record: LeaveRecord;
  actions?: React.ReactNode;
}

export function LeaveRequestCard({ record, actions }: Props) {
  const color = getLeaveColor(record.leave_type);
  const startDate = format(new Date(record.start_date), 'MMM d, yyyy');
  const endDate = format(new Date(record.end_date), 'MMM d, yyyy');

  return (
    <View style={styles.card}>
      <View style={[styles.accent, { backgroundColor: color.start }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.typePill, { backgroundColor: color.light }]}>
            <Text style={[styles.typeText, { color: color.start }]}>{record.leave_type}</Text>
          </View>
          <StatusBadge status={record.status} />
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.mutedForeground} />
          <Text style={styles.dateText}>
            {startDate} {record.start_date !== record.end_date ? `→ ${endDate}` : ''}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.duration}>
            {record.duration} {record.duration === 1 ? 'day' : 'days'}{' '}
            {record.leave_length === 'half_day' ? '(half day)' : ''}
          </Text>
          {record.feedback ? (
            <Text style={styles.feedback} numberOfLines={1}>
              "{record.feedback}"
            </Text>
          ) : null}
        </View>

        {record.leave_comment ? (
          <Text style={styles.comment} numberOfLines={2}>
            {record.leave_comment}
          </Text>
        ) : null}

        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 13,
    color: Colors.foreground,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    fontSize: 12,
    color: Colors.mutedForeground,
  },
  feedback: {
    fontSize: 11,
    color: Colors.mutedForeground,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  comment: {
    fontSize: 12,
    color: Colors.mutedForeground,
    lineHeight: 16,
  },
  actions: {
    marginTop: 6,
  },
});
