import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function UsersScreen() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['mobile-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#6b7280' }}>Loading users...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#dc2626' }}>Failed to load users</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', padding: 16 }}>
      <Text style={{ marginBottom: 16, fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Users</Text>
      {users?.length === 0 ? (
        <Text style={{ textAlign: 'center', color: '#6b7280' }}>No users found</Text>
      ) : (
        users?.map((user: unknown) => {
          const u = user as { id: string; firstName: string; lastName: string; email: string; role: string; status: string };
          return (
            <TouchableOpacity key={u.id} style={{ marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>{u.firstName} {u.lastName}</Text>
              <Text style={{ fontSize: 14, color: '#6b7280' }}>{u.email}</Text>
              <View style={{ marginTop: 8, flexDirection: 'row', gap: 8 }}>
                <Text style={{ borderRadius: 9999, backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: '600', color: '#1e40af' }}>{u.role}</Text>
                <Text style={{ borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 4, fontSize: 12, fontWeight: '600', backgroundColor: u.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2', color: u.status === 'ACTIVE' ? '#065f46' : '#991b1b' }}>{u.status}</Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}
