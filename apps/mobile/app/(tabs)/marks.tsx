import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

type ResultRow = {
  id: string;
  subjectName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade?: string;
};

export default function MarksScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mobile-marks'],
    queryFn: async () => {
      const { data } = await api.get('/marks/my');
      return data as ResultRow[];
    },
    enabled: !!user && user.role === 'STUDENT',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const results = data ?? [];

  const getGradeColor = (grade?: string) => {
    if (!grade) return '#6b7280';
    const g = grade.toUpperCase();
    if (['A+', 'A', 'A-'].includes(g)) return '#065f46';
    if (['B+', 'B', 'B-'].includes(g)) return '#1e40af';
    if (['C+', 'C', 'C-'].includes(g)) return '#92400e';
    return '#991b1b';
  };

  const renderItem = ({ item }: { item: ResultRow }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="trophy" size={20} color="#4b5563" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.title}>{item.subjectName || 'Result'}</Text>
          <Text style={styles.subtitle}>
            {item.obtainedMarks} / {item.totalMarks}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>
              {item.percentage.toFixed(1)}%
            </Text>
            {item.grade && (
              <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(item.grade) + '20' }]}>
                <Text style={[styles.gradeText, { color: getGradeColor(item.grade) }]}>
                  {item.grade}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading marks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Failed to load marks</Text>
      </View>
    );
  }

  if (user?.role !== 'STUDENT') {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Marks are only available for students</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Marks</Text>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No results found</Text>}
        contentContainerStyle={results.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' },
  heading: { marginBottom: 16, fontSize: 24, fontWeight: 'bold', color: '#111827', paddingHorizontal: 16, paddingTop: 16 },
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  meta: { fontSize: 13, color: '#4b5563' },
  gradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gradeText: { fontSize: 12, fontWeight: '700' },
  muted: { color: '#6b7280' },
  error: { color: '#dc2626' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
