import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { leaveApi, usersApi } from '../../services/api';
import { Colors } from '../../theme/colors';
import { LeaveRequestCard, LeaveRecord } from '../../components/LeaveRequestCard';

interface UserOption {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
}

type FilterStatus = 'all' | 'approved' | 'pending' | 'rejected' | 'cancelled';

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function TeamLeaveHistoryScreen() {
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [userPickerVisible, setUserPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => usersApi.getAllUsers().then((r) => r.data.data as UserOption[]),
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['team-leave-history', selectedUser?.id],
    queryFn: () =>
      leaveApi
        .getUserLeaveHistory(selectedUser!.id)
        .then((r) => r.data.data as LeaveRecord[]),
    enabled: !!selectedUser,
  });

  const users = usersData ?? [];
  const filteredUsers = searchQuery
    ? users.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const records = historyData ?? [];
  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Team Leave History</Text>
        <Text style={styles.pageSubtitle}>View leave history for any team member</Text>
      </View>

      {/* User selector */}
      <View style={styles.selectorSection}>
        <TouchableOpacity
          style={styles.userSelector}
          onPress={() => setUserPickerVisible(true)}
          activeOpacity={0.7}
        >
          {selectedUser ? (
            <View style={styles.selectedUserRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {selectedUser.firstName[0]}
                  {selectedUser.lastName[0]}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Text>
                <Text style={styles.userJob}>{selectedUser.jobTitle}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.placeholderRow}>
              <Ionicons name="person-outline" size={18} color={Colors.mutedForeground} />
              <Text style={styles.placeholder}>
                {usersLoading ? 'Loading employees...' : 'Select an employee'}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-down" size={16} color={Colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {selectedUser && (
        <>
          {/* Summary stats */}
          {records.length > 0 && (
            <View style={styles.statsRow}>
              {(['pending', 'approved', 'rejected'] as FilterStatus[]).map((s) => {
                const count = records.filter((r) => r.status === s).length;
                const colors = getStatColors(s);
                return (
                  <View key={s} style={[styles.statCard, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.statCount, { color: colors.text }]}>{count}</Text>
                    <Text style={[styles.statLabel, { color: colors.text }]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Filter tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {FILTERS.map(({ key, label }) => {
              const count =
                key === 'all' ? records.length : records.filter((r) => r.status === key).length;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterTab, filter === key && styles.filterTabActive]}
                  onPress={() => setFilter(key)}
                >
                  <Text
                    style={[styles.filterTabText, filter === key && styles.filterTabTextActive]}
                  >
                    {label}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.countBadge, filter === key && styles.countBadgeActive]}>
                      <Text
                        style={[styles.countText, filter === key && styles.countTextActive]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {historyLoading ? (
            <ActivityIndicator color={Colors.foreground} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={48} color={Colors.mutedForeground} />
                  <Text style={styles.emptyTitle}>No {filter !== 'all' ? filter : ''} leaves</Text>
                  <Text style={styles.emptySubtitle}>
                    {selectedUser.firstName} has no {filter !== 'all' ? filter : ''} leave records.
                  </Text>
                </View>
              }
              renderItem={({ item }) => <LeaveRequestCard record={item} />}
            />
          )}
        </>
      )}

      {!selectedUser && !usersLoading && (
        <View style={styles.promptState}>
          <Ionicons name="people-outline" size={56} color={Colors.mutedForeground} />
          <Text style={styles.promptTitle}>Select a team member</Text>
          <Text style={styles.promptSubtitle}>
            Choose an employee above to view their leave history.
          </Text>
        </View>
      )}

      {/* User Picker Modal */}
      <Modal
        visible={userPickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setUserPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <TouchableOpacity onPress={() => setUserPickerVisible(false)}>
              <Ionicons name="close" size={22} color={Colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={16} color={Colors.mutedForeground} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email..."
              placeholderTextColor={Colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.userList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.userRow,
                  selectedUser?.id === item.id && styles.userRowActive,
                ]}
                onPress={() => {
                  setSelectedUser(item);
                  setFilter('all');
                  setUserPickerVisible(false);
                }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.firstName[0]}
                    {item.lastName[0]}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.userJob}>{item.jobTitle}</Text>
                </View>
                {selectedUser?.id === item.id && (
                  <Ionicons name="checkmark" size={18} color={Colors.foreground} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function getStatColors(status: string) {
  const map: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fef9c3', text: '#ca8a04' },
    approved: { bg: '#dcfce7', text: '#16a34a' },
    rejected: { bg: '#fee2e2', text: '#dc2626' },
  };
  return map[status] ?? { bg: Colors.secondary, text: Colors.mutedForeground };
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.foreground },
  pageSubtitle: { fontSize: 14, color: Colors.mutedForeground, marginTop: 2 },
  selectorSection: { paddingHorizontal: 20, marginTop: 12 },
  userSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: Colors.card,
  },
  selectedUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  placeholderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  placeholder: { fontSize: 15, color: Colors.mutedForeground },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  userJob: { fontSize: 12, color: Colors.mutedForeground, marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  statCount: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  filterScroll: { flexGrow: 0, marginTop: 12 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterTabText: { fontSize: 13, fontWeight: '500', color: Colors.mutedForeground },
  filterTabTextActive: { color: Colors.primaryForeground },
  countBadge: {
    backgroundColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontSize: 11, color: Colors.mutedForeground, fontWeight: '600' },
  countTextActive: { color: Colors.primaryForeground },
  list: { padding: 20, paddingTop: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.foreground, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, textAlign: 'center', paddingHorizontal: 20 },
  promptState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  promptTitle: { fontSize: 18, fontWeight: '600', color: Colors.foreground, marginTop: 16 },
  promptSubtitle: { fontSize: 14, color: Colors.mutedForeground, marginTop: 6, textAlign: 'center' },
  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.secondary,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 15, color: Colors.foreground },
  userList: { paddingHorizontal: 20 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userRowActive: { backgroundColor: Colors.secondary, marginHorizontal: -20, paddingHorizontal: 20 },
});
