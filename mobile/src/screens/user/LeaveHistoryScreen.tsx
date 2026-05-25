import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isFuture } from 'date-fns';
import { leaveApi } from '../../services/api';
import { Colors } from '../../theme/colors';
import { LeaveRequestCard, LeaveRecord } from '../../components/LeaveRequestCard';
import { StatusBadge } from '../../components/StatusBadge';

type FilterStatus = 'all' | 'approved' | 'pending' | 'rejected' | 'cancelled';

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function LeaveHistoryScreen() {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [cancelModal, setCancelModal] = useState<{ visible: boolean; leaveId: number | null }>({
    visible: false,
    leaveId: null,
  });
  const [cancelFeedback, setCancelFeedback] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leave-history'],
    queryFn: () => leaveApi.getLeaveHistory().then((r) => r.data.data as LeaveRecord[]),
  });

  const records = data ?? [];
  const filtered =
    filter === 'all' ? records : records.filter((r) => r.status === filter);

  function canCancel(record: LeaveRecord) {
    if (record.status === 'pending') return true;
    if (record.status === 'approved' && isFuture(new Date(record.start_date))) return true;
    return false;
  }

  async function handleCancel() {
    if (!cancelModal.leaveId) return;
    setCancelling(true);
    try {
      await leaveApi.cancelLeave(cancelModal.leaveId, cancelFeedback);
      await queryClient.invalidateQueries({ queryKey: ['leave-history'] });
      setCancelModal({ visible: false, leaveId: null });
      setCancelFeedback('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to cancel leave.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Leave History</Text>
        <Text style={styles.pageSubtitle}>Track all your leave applications</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map(({ key, label }) => {
          const count = key === 'all' ? records.length : records.filter((r) => r.status === key).length;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.filterTab, filter === key && styles.filterTabActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterTabText, filter === key && styles.filterTabTextActive]}>
                {label}
              </Text>
              {count > 0 && (
                <View style={[styles.countBadge, filter === key && styles.countBadgeActive]}>
                  <Text style={[styles.countText, filter === key && styles.countTextActive]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
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
                {filter === 'all'
                  ? 'You have not applied for any leave yet.'
                  : `You have no ${filter} leave applications.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <LeaveRequestCard
              record={item}
              actions={
                canCancel(item) ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setCancelModal({ visible: true, leaveId: item.id });
                      setCancelFeedback('');
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={14} color={Colors.destructive} />
                    <Text style={styles.cancelBtnText}>Cancel Leave</Text>
                  </TouchableOpacity>
                ) : null
              }
            />
          )}
        />
      )}

      {/* Cancel Modal */}
      <Modal
        visible={cancelModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModal({ visible: false, leaveId: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Leave</Text>
              <TouchableOpacity onPress={() => setCancelModal({ visible: false, leaveId: null })}>
                <Ionicons name="close" size={22} color={Colors.foreground} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for cancelling this leave application.
            </Text>
            <TextInput
              style={styles.modalTextarea}
              placeholder="Reason for cancellation (optional)"
              placeholderTextColor={Colors.mutedForeground}
              value={cancelFeedback}
              onChangeText={setCancelFeedback}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCancelModal({ visible: false, leaveId: null })}
              >
                <Text style={styles.modalCancelBtnText}>Keep Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, cancelling && { opacity: 0.6 }]}
                onPress={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Cancel Leave</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.foreground },
  pageSubtitle: { fontSize: 14, color: Colors.mutedForeground, marginTop: 2 },
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
  list: { padding: 20, paddingTop: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.foreground, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4, textAlign: 'center' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  cancelBtnText: { fontSize: 13, color: Colors.destructive, fontWeight: '500' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
  modalSubtitle: { fontSize: 14, color: Colors.mutedForeground, lineHeight: 20, marginBottom: 16 },
  modalTextarea: {
    borderWidth: 1,
    borderColor: Colors.input,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.foreground,
    minHeight: 80,
    backgroundColor: Colors.background,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: { fontSize: 14, fontWeight: '500', color: Colors.foreground },
  modalConfirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
