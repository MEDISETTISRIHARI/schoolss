import { View, Text, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function HomeScreen() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['mobile-dashboard-stats'],
    queryFn: async () => {
      let schools: Array<Record<string, unknown>> = [];
      let users: Array<Record<string, unknown>> = [];
      try {
        const schoolsRes = await api.get('/schools');
        schools = schoolsRes.data;
      } catch (e) {
        console.warn('Failed to load schools for dashboard stats', e);
      }
      try {
        const usersRes = await api.get('/users');
        users = usersRes.data;
      } catch (e) {
        console.warn('Failed to load users for dashboard stats', e);
      }
      return {
        totalSchools: schools.length,
        totalUsers: users.length,
        totalStudents: users.filter((u) => u.role === 'STUDENT').length,
        totalTeachers: users.filter((u) => u.role === 'TEACHER').length,
      };
    },
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#6b7280' }}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <Text style={{ color: '#dc2626' }}>Failed to load dashboard</Text>
      </View>
    );
  }

  const statCards = [
    { name: 'Schools', value: stats?.totalSchools ?? 0 },
    { name: 'Users', value: stats?.totalUsers ?? 0 },
    { name: 'Students', value: stats?.totalStudents ?? 0 },
    { name: 'Teachers', value: stats?.totalTeachers ?? 0 },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb', padding: 16 }}>
      <Text style={{ marginBottom: 16, fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Dashboard</Text>
      <View style={{ gap: 16 }}>
        {statCards.map((stat) => (
          <View key={stat.name} style={{ borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#6b7280' }}>{stat.name}</Text>
            <Text style={{ fontSize: 30, fontWeight: '600', color: '#111827' }}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
