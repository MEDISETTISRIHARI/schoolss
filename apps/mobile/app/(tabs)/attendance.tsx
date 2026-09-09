import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

type AttendanceRecord = {
  id: string;
  status: string;
  date: string;
  className?: string;
  subjectName?: string;
};

export default function AttendanceScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const isStudent = user?.role === 'STUDENT';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mobile-attendance'],
    queryFn: async () => {
      const endpoint = isStudent ? '/attendance/my' : '/attendance';
      const { data } = await api.get(endpoint);
      return data as AttendanceRecord[];
    },
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const records = data ?? [];

  const present = records.filter((r) => r.status === 'PRESENT').length;
  const absent = records.filter((r) => r.status === 'ABSENT').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const excused = records.filter((r) => r.status === 'EXCUSED').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return '#065f46';
      case 'ABSENT':
        return '#991b1b';
      case 'LATE':
        return '#92400e';
      case 'EXCUSED':
        return '#1e40af';
      default:
        return '#374151';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return '#d1fae5';
      case 'ABSENT':
        return '#fee2e2';
      case 'LATE':
        return '#fef3c7';
      case 'EXCUSED':
        return '#dbeafe';
      default:
        return '#f3f4f6';
    }
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardInfo}>
          <Text style={styles.title}>{item.className || 'Class'}</Text>
          {item.subjectName && <Text style={styles.subtitle}>{item.subjectName}</Text>}
          <Text style={styles.meta}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: getStatusBg(item.status) }]}>
          <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading attendance...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Failed to load attendance</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Attendance</Text>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.summaryValue}>{present}</Text>
          <Text style={styles.summaryLabel}>Present</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#ef4444' }]}>
          <Text style={styles.summaryValue}>{absent}</Text>
          <Text style={styles.summaryLabel}>Absent</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.summaryValue}>{late}</Text>
          <Text style={styles.summaryLabel}>Late</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: '#3b82f6' }]}>
          <Text style={styles.summaryValue}>{excused}</Text>
          <Text style={styles.summaryLabel}>Excused</Text>
        </View>
      </View>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No attendance records found</Text>}
        contentContainerStyle={records.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  heading: { marginBottom: 16, fontSize: 24, fontWeight: 'bold', color: '#111827', paddingHorizontal: 16, paddingTop: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#111827', textAlign: 'center' },
  summaryLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 4 },
  card: {
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  meta: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  muted: { color: '#6b7280' },
  error: { color: '#dc2626' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
