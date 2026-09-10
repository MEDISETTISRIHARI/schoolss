'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@school-management/ui-components';

interface AdminStats {
  totalSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [schoolsRes, usersRes] = await Promise.all([
        api.get('/schools'),
        api.get('/users'),
      ]);
      const schools = schoolsRes.data;
      const users = usersRes.data;
      return {
        totalSchools: schools.length,
        totalUsers: users.length,
        totalStudents: users.filter((u: any) => u.role === 'STUDENT').length,
        totalTeachers: users.filter((u: any) => u.role === 'TEACHER').length,
      };
    },
  });

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load dashboard</div>;
  }

  const statCards = [
    { name: 'Total Schools', value: stats?.totalSchools ?? 0, color: 'bg-blue-500' },
    { name: 'Total Users', value: stats?.totalUsers ?? 0, color: 'bg-green-500' },
    { name: 'Students', value: stats?.totalStudents ?? 0, color: 'bg-purple-500' },
    { name: 'Teachers', value: stats?.totalTeachers ?? 0, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                <div className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-gray-500">
                    {stat.name}
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stat.value}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


