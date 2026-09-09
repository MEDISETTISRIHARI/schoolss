import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  publishedAt?: string;
  isRead?: boolean;
};

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mobile-notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data as NotificationRow[];
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-notifications'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to mark notification as read');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const notifications = data ?? [];

  const renderItem = ({ item }: { item: NotificationRow }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.unreadCard]}
      onPress={() => {
        if (!item.isRead) {
          markAsRead.mutate(item.id);
        }
      }}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: item.isRead ? '#f3f4f6' : '#dbeafe' }]}>
          <Ionicons
            name="notifications"
            size={20}
            color={item.isRead ? '#6b7280' : '#1e40af'}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.title, !item.isRead && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          {item.publishedAt && (
            <Text style={styles.meta}>
              {new Date(item.publishedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading notifications...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Failed to load notifications</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No notifications found</Text>}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
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
  unreadCard: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#6b7280' },
  unreadTitle: { color: '#111827' },
  body: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  meta: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  muted: { color: '#6b7280' },
  error: { color: '#dc2626' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 32 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});
