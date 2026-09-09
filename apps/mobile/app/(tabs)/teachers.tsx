import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

type TeacherRow = {
  id: string;
  employeeId: string;
  user: { firstName: string; lastName: string; email: string };
  subject?: { name: string };
};

export default function TeachersScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mobile-teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data as TeacherRow[];
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const teachers = data ?? [];

  const renderItem = ({ item }: { item: TeacherRow }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="school" size={20} color="#4b5563" />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.title}>
            {item.user.firstName} {item.user.lastName}
          </Text>
          <Text style={styles.subtitle}>ID: {item.employeeId}</Text>
          <Text style={styles.meta}>{item.user.email}</Text>
          {item.subject && <Text style={styles.meta}>Subject: {item.subject.name}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading teachers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Failed to load teachers</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Teachers</Text>
      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No teachers found</Text>}
        contentContainerStyle={teachers.length === 0 ? styles.emptyContainer : undefined}
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
  meta: { fontSize: 13, color: '#4b5563', marginTop: 2 },
  muted: { color: '#6b7280' },
  error: { color: '#dc2626' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
