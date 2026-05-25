import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { leaveApi } from '../../services/api';
import { Colors, getLeaveColor, getStatusColor } from '../../theme/colors';
import { StatusBadge } from '../../components/StatusBadge';

interface LeaveRequest {
  id: number;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  duration: number;
  leave_comment: string;
  leave_length: 'half_day' | 'full_day';
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  feedback?: string;
}

type ActionType = 'approve' | 'reject';
type FilterTab = 'pending' | 'approved' | 'rejected' | 'all';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

export function ApproveLeaveScreen() {
  const [tab, setTab] = useState<FilterTab>('pending');
  const [modal, setModal] = useState<{
    visible: boolean;
    request: LeaveRequest | null;
    action: ActionType;
  }>({ visible: false, request: null, action: 'approve' });
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['all-leave-requests'],
    queryFn: () =>
      leaveApi.getAllLeaveRequests(1, 100).then((r) => r.data.data.requests as LeaveRequest[]),
  });

  const requests = data ?? [];
  const filtered = tab === 'all' ? requests : requests.filter((r) => r.status === tab);
  const stats = {
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  function openAction(request: LeaveRequest, action: ActionType) {
    setModal({ visible: true, request, action });
    setComment('');
  }

  async function handleAction() {
    if (!modal.request) return;
    setActionLoading(true);
    try {
      if (modal.action === 'approve') {
        await leaveApi.approveLeave(modal.request.id, comment);
      } else {
        await leaveApi.rejectLeave(modal.request.id, comment);
      }
      await queryClient.invalidateQueries({ queryKey: ['all-leave-requests'] });
      setModal({ visible: false, request: null, action: 'approve' });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to process action.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Stats bar */}
      <View style={styles.statsRow}>
        <StatCard label="Pending" count={stats.pending} color="#ca8a04" bg="#fef9c3" />
        <StatCard label="Approved" count={stats.approved} color="#16a34a" bg="#dcfce7" />
        <StatCard label="Rejected" count={stats.rejected} color="#dc2626" bg="#fee2e2" />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.foreground} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.foreground} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.mutedForeground} />
              <Text style={styles.emptyTitle}>No {tab} requests</Text>
              <Text style={styles.emptySubtitle}>All caught up!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <RequestCard
              request={item}
              onApprove={item.status === 'pending' ? () => openAction(item, 'approve') : undefined}
              onReject={item.status === 'pending' ? () => openAction(item, 'reject') : undefined}
            />
          )}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={modal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModal({ visible: false, request: null, action: 'approve' })}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modal.action === 'approve' ? 'Approve' : 'Reject'} Leave
              </Text>
              <TouchableOpacity
                onPress={() => setModal({ visible: false, request: null, action: 'approve' })}
              >
                <Ionicons name="close" size={22} color={Colors.foreground} />
              </TouchableOpacity>
            </View>
            {modal.request && (
              <View style={styles.requestSummary}>
                <Text style={styles.requestName}>
                  {modal.request.firstName} {modal.request.lastName}
                </Text>
                <Text style={styles.requestDetail}>
                  {modal.request.leave_type} · {modal.request.duration}{' '}
                  {modal.request.duration === 1 ? 'day' : 'days'}
                </Text>
                <Text style={styles.requestDetail}>
                  {format(new Date(modal.request.start_date), 'MMM d')} –{' '}
                  {format(new Date(modal.request.end_date), 'MMM d, yyyy')}
                </Text>
              </View>
            )}
            <Text style={styles.commentLabel}>
              Comment {modal.action === 'approve' ? '(optional)' : '(required)'}
            </Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.mutedForeground}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModal({ visible: false, request: null, action: 'approve' })}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  modal.action === 'reject' && styles.rejectBtn,
                  actionLoading && { opacity: 0.6 },
                ]}
                onPress={handleAction}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.actionBtnText}>
                    {modal.action === 'approve' ? 'Approve' : 'Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: bg }]}>
      <Text style={[statStyles.count, { color }]}>{count}</Text>
      <Text style={[statStyles.label, { color }]}>{label}</Text>
    </View>
  );
}

function RequestCard({
  request,
  onApprove,
  onReject,
}: {
  request: LeaveRequest;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const color = getLeaveColor(request.leave_type);
  return (
    <View style={[cardStyles.card, { borderLeftColor: color.start }]}>
      <View style={cardStyles.row}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>
            {request.firstName[0]}
            {request.lastName[0]}
          </Text>
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.name}>
            {request.firstName} {request.lastName}
          </Text>
          <Text style={cardStyles.jobTitle}>{request.jobTitle}</Text>
        </View>
        <StatusBadge status={request.status} />
      </View>

      <View style={cardStyles.details}>
        <View style={[cardStyles.typePill, { backgroundColor: color.light }]}>
          <Text style={[cardStyles.typeText, { color: color.start }]}>{request.leave_type}</Text>
        </View>
        <Text style={cardStyles.dates}>
          {format(new Date(request.start_date), 'MMM d')} –{' '}
          {format(new Date(request.end_date), 'MMM d, yyyy')}
        </Text>
        <Text style={cardStyles.duration}>
          {request.duration} {request.duration === 1 ? 'day' : 'days'}
          {request.leave_length === 'half_day' ? ' (half day)' : ''}
        </Text>
      </View>

      {request.leave_comment ? (
        <Text style={cardStyles.comment} numberOfLines={2}>
          "{request.leave_comment}"
        </Text>
      ) : null}

      {(onApprove || onReject) && (
        <View style={cardStyles.actions}>
          <TouchableOpacity style={cardStyles.rejectBtn} onPress={onReject}>
            <Ionicons name="close-outline" size={16} color={Colors.destructive} />
            <Text style={cardStyles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.approveBtn} onPress={onApprove}>
            <Ionicons name="checkmark-outline" size={16} color="#fff" />
            <Text style={cardStyles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.feedback && (
        <Text style={cardStyles.feedback}>Feedback: "{request.feedback}"</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.mutedForeground },
  tabTextActive: { color: Colors.primaryForeground },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.foreground, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Colors.mutedForeground, marginTop: 4 },
  overlay: {
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
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
  requestSummary: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  requestName: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
  requestDetail: { fontSize: 13, color: Colors.mutedForeground, marginTop: 2 },
  commentLabel: { fontSize: 13, fontWeight: '500', color: Colors.foreground, marginBottom: 6 },
  commentInput: {
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
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '500', color: Colors.foreground },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: { backgroundColor: Colors.destructive },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  count: { fontSize: 24, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '500', marginTop: 2 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  jobTitle: { fontSize: 12, color: Colors.mutedForeground, marginTop: 1 },
  details: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 12, fontWeight: '600' },
  dates: { fontSize: 12, color: Colors.foreground },
  duration: { fontSize: 12, color: Colors.mutedForeground },
  comment: { fontSize: 12, color: Colors.mutedForeground, fontStyle: 'italic' },
  feedback: { fontSize: 12, color: Colors.mutedForeground, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.destructive,
  },
  rejectBtnText: { fontSize: 13, fontWeight: '600', color: Colors.destructive },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.success,
  },
  approveBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
