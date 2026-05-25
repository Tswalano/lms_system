import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { leaveApi } from '../../services/api';
import { Colors } from '../../theme/colors';
import { LeaveBalanceCard } from '../../components/LeaveBalanceCard';
import { LeaveRequestCard, LeaveRecord } from '../../components/LeaveRequestCard';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UserTabParamList } from '../../navigation';

type Nav = NativeStackNavigationProp<UserTabParamList>;

const LEAVE_ORDER = ['Annual Leave', 'Sick Leave', 'Paternity Leave', 'Family Responsibility'];

export function DashboardScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<Nav>();

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['leave-history'],
    queryFn: () => leaveApi.getLeaveHistory().then((r) => r.data.data as LeaveRecord[]),
  });

  const recentLeaves = (historyData ?? []).slice(0, 3);

  const sortedLeaveData = LEAVE_ORDER.map((type) => {
    const found = user?.leaveData?.find((l) => l.leave_type === type);
    return found ?? { leave_type: type, leave_count: 0 };
  }).filter((l) => user?.leaveData?.some((d) => d.leave_type === l.leave_type));

  const pendingCount = (historyData ?? []).filter((l) => l.status === 'pending').length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()},</Text>
            <Text style={styles.name}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.jobTitle}>{user?.jobTitle}</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={logout}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pending banner */}
        {pendingCount > 0 && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={16} color="#ca8a04" />
            <Text style={styles.pendingText}>
              You have {pendingCount} pending leave{pendingCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Leave balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Balances</Text>
          {sortedLeaveData.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.balanceScroll}>
              {sortedLeaveData.map((l) => (
                <LeaveBalanceCard key={l.leave_type} leaveType={l.leave_type} count={l.leave_count} />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>No leave balance data available.</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="add-circle-outline"
              label="Apply Leave"
              onPress={() => (navigation as any).navigate('ApplyLeave')}
            />
            <QuickAction
              icon="list-outline"
              label="My History"
              onPress={() => (navigation as any).navigate('LeaveHistory')}
            />
          </View>
        </View>

        {/* Recent leaves */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Leaves</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('LeaveHistory')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={Colors.foreground} style={{ marginTop: 16 }} />
          ) : recentLeaves.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={40} color={Colors.mutedForeground} />
              <Text style={styles.emptyStateText}>No leave applications yet</Text>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => (navigation as any).navigate('ApplyLeave')}
              >
                <Text style={styles.applyBtnText}>Apply for leave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentLeaves.map((item) => <LeaveRequestCard key={item.id} record={item} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={22} color={Colors.foreground} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { fontSize: 14, color: Colors.mutedForeground },
  name: { fontSize: 20, fontWeight: '700', color: Colors.foreground, marginTop: 2 },
  jobTitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 2 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#fef9c3',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pendingText: { fontSize: 13, color: '#92400e', fontWeight: '500' },
  section: { paddingHorizontal: 20, marginTop: 24 },
  lastSection: { paddingBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.foreground, marginBottom: 12 },
  seeAll: { fontSize: 13, color: Colors.mutedForeground, textDecorationLine: 'underline' },
  balanceScroll: { marginLeft: -20, paddingLeft: 20 },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionLabel: { fontSize: 13, fontWeight: '500', color: Colors.foreground },
  emptyText: { fontSize: 13, color: Colors.mutedForeground },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyStateText: { fontSize: 14, color: Colors.mutedForeground, marginTop: 8, marginBottom: 16 },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
