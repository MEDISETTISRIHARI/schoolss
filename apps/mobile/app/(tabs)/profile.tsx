import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function ProfileScreen() {
  const { user } = useAuthStore();

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['mobile-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/me');
      return data;
    },
    enabled: !!user,
  });

  if (error) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', padding: 16 }}>
        <Text style={{ marginBottom: 16, fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Profile</Text>
        <Text style={{ color: '#dc2626' }}>Failed to load profile</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', padding: 16 }}>
      <Text style={{ marginBottom: 16, fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Profile</Text>
      {isLoading ? (
        <Text style={{ color: '#6b7280' }}>Loading profile...</Text>
      ) : userProfile ? (
        <View style={{ gap: 16 }}>
          <View style={{ borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Name</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>{userProfile.firstName} {userProfile.lastName}</Text>
          </View>
          <View style={{ borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Email</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>{userProfile.email}</Text>
          </View>
          <View style={{ borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>Role</Text>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>{userProfile.role}</Text>
          </View>
          {userProfile.school && (
            <View style={{ borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>School</Text>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>{userProfile.school.name}</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={{ color: '#6b7280' }}>No profile data available</Text>
      )}
    </ScrollView>
  );
}
