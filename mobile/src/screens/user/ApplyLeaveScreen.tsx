import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { format, differenceInBusinessDays, addDays, isBefore, startOfDay } from 'date-fns';
import { leaveApi } from '../../services/api';
import { Colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Paternity Leave', 'Family Responsibility'];
const LEAVE_LENGTHS = [
  { value: 'full_day', label: 'Full Day' },
  { value: 'half_day', label: 'Half Day' },
];

type LeaveLength = 'full_day' | 'half_day';
type DateField = 'start' | 'end';

export function ApplyLeaveScreen() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [leaveType, setLeaveType] = useState('Annual Leave');
  const [leaveLength, setLeaveLength] = useState<LeaveLength>('full_day');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState<DateField | null>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);

  const today = startOfDay(new Date());
  const isBackdated = isBefore(startOfDay(startDate), today);
  const dayCount =
    leaveLength === 'half_day'
      ? 0.5
      : Math.max(1, differenceInBusinessDays(addDays(endDate, 1), startDate));

  const balance =
    user?.leaveData?.find((l) => l.leave_type === leaveType)?.leave_count ?? 0;

  async function handleSubmit() {
    if (!reason.trim()) {
      return Alert.alert('Validation', 'Please provide a reason for your leave.');
    }
    if (isBefore(endDate, startDate)) {
      return Alert.alert('Validation', 'End date cannot be before start date.');
    }

    setLoading(true);
    try {
      await leaveApi.applyLeave({
        leave_type: leaveType,
        leave_start: format(startDate, 'yyyy-MM-dd'),
        leave_end: format(endDate, 'yyyy-MM-dd'),
        leave_comment: reason.trim(),
        leave_length: leaveLength,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leave-history'] }),
        refreshUser(),
      ]);
      Alert.alert('Success', 'Your leave application has been submitted.');
      setReason('');
      setStartDate(new Date());
      setEndDate(new Date());
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Failed to submit leave application.');
    } finally {
      setLoading(false);
    }
  }

  function onDateChange(_: unknown, date?: Date) {
    if (!date) { setShowPicker(null); return; }
    if (showPicker === 'start') {
      setStartDate(date);
      if (isBefore(endDate, date)) setEndDate(date);
    } else {
      setEndDate(date);
    }
    if (Platform.OS === 'android') setShowPicker(null);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Request Leave</Text>
          <Text style={styles.pageSubtitle}>Submit a new leave application</Text>
        </View>

        {/* Balance indicator */}
        <View style={styles.balanceBar}>
          <Ionicons name="information-circle-outline" size={15} color={Colors.mutedForeground} />
          <Text style={styles.balanceText}>
            {leaveType}: <Text style={styles.balanceBold}>{balance} days</Text> remaining
          </Text>
        </View>

        {/* Backdated warning */}
        {isBackdated && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={15} color="#ca8a04" />
            <Text style={styles.warningText}>
              You are applying for backdated leave. This may require additional approval.
            </Text>
          </View>
        )}

        <View style={styles.form}>
          {/* Leave Type */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Leave Type</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowTypePicker((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectBtnText}>{leaveType}</Text>
              <Ionicons name={showTypePicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.mutedForeground} />
            </TouchableOpacity>
            {showTypePicker && (
              <View style={styles.dropdown}>
                {LEAVE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.dropdownItem, type === leaveType && styles.dropdownItemActive]}
                    onPress={() => { setLeaveType(type); setShowTypePicker(false); }}
                  >
                    <Text style={[styles.dropdownItemText, type === leaveType && styles.dropdownItemTextActive]}>
                      {type}
                    </Text>
                    {type === leaveType && <Ionicons name="checkmark" size={16} color={Colors.foreground} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Leave Length */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Leave Length</Text>
            <View style={styles.segmentRow}>
              {LEAVE_LENGTHS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.segment, leaveLength === value && styles.segmentActive]}
                  onPress={() => setLeaveLength(value as LeaveLength)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.segmentText, leaveLength === value && styles.segmentTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('start')}>
                <Ionicons name="calendar-outline" size={16} color={Colors.mutedForeground} />
                <Text style={styles.dateBtnText}>{format(startDate, 'MMM d, yyyy')}</Text>
              </TouchableOpacity>
            </View>
            {leaveLength === 'full_day' && (
              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>End Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker('end')}>
                  <Ionicons name="calendar-outline" size={16} color={Colors.mutedForeground} />
                  <Text style={styles.dateBtnText}>{format(endDate, 'MMM d, yyyy')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showPicker && (
            <DateTimePicker
              value={showPicker === 'start' ? startDate : endDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDateChange}
              minimumDate={showPicker === 'end' ? startDate : undefined}
            />
          )}

          {/* Day count */}
          <View style={styles.daySummary}>
            <Ionicons name="time-outline" size={14} color={Colors.mutedForeground} />
            <Text style={styles.daySummaryText}>
              {dayCount} {dayCount === 1 ? 'day' : 'days'} selected
            </Text>
          </View>

          {/* Reason */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={styles.textarea}
              placeholder="Describe the reason for your leave..."
              placeholderTextColor={Colors.mutedForeground}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  pageHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.foreground },
  pageSubtitle: { fontSize: 14, color: Colors.mutedForeground, marginTop: 2 },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceText: { fontSize: 13, color: Colors.mutedForeground },
  balanceBold: { fontWeight: '600', color: Colors.foreground },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#fef9c3',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 18 },
  form: { padding: 20, gap: 4 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.foreground, marginBottom: 6 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.input,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  selectBtnText: { fontSize: 15, color: Colors.foreground },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.card,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: { backgroundColor: Colors.secondary },
  dropdownItemText: { fontSize: 14, color: Colors.foreground },
  dropdownItemTextActive: { fontWeight: '600' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  segmentActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { fontSize: 14, color: Colors.mutedForeground, fontWeight: '500' },
  segmentTextActive: { color: Colors.primaryForeground },
  dateRow: { flexDirection: 'row', marginBottom: 0 },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  dateBtnText: { fontSize: 14, color: Colors.foreground },
  daySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 16,
    marginTop: -8,
  },
  daySummaryText: { fontSize: 12, color: Colors.mutedForeground },
  textarea: {
    borderWidth: 1,
    borderColor: Colors.input,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.foreground,
    minHeight: 96,
    backgroundColor: Colors.background,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    height: 50,
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
