import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getLeaveColor } from '../theme/colors';

const leaveIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Annual Leave': 'umbrella-outline',
  'Sick Leave': 'heart-outline',
  'Paternity Leave': 'people-outline',
  'Family Responsibility': 'home-outline',
};

interface Props {
  leaveType: string;
  count: number;
}

export function LeaveBalanceCard({ leaveType, count }: Props) {
  const color = getLeaveColor(leaveType);
  const icon = leaveIcons[leaveType] ?? 'calendar-outline';

  return (
    <LinearGradient
      colors={[color.start, color.end]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>{leaveType}</Text>
      <Text style={styles.sub}>days remaining</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 155,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  count: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 36,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
  },
  sub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
