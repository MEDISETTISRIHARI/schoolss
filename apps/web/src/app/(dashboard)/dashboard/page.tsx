'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@school-management/ui-components';

interface DashboardStats {
  totalSchools: number;
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
}

export default function DashboardPage() {
  const {
    data: schoolsData,
    isLoading: schoolsLoading,
    error: schoolsError,
  } = useQuery({
    queryKey: ['dashboard-schools'],
    queryFn: async () => {
      const { data } = await api.get('/schools');
      return data;
    },
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const schools = Array.isArray(schoolsData) ? schoolsData : [];
  const users = Array.isArray(usersData) ? usersData : [];

  const totalSchools = schools.length;
  const totalUsers = users.length;
  const totalStudents = users.filter((u: any) => u.role === 'STUDENT').length;
  const totalTeachers = users.filter((u: any) => u.role === 'TEACHER').length;

  const getErrorMessage = (error: unknown): string | undefined => {
    if (!error) return undefined;
    const err = error as any;
    return err?.response?.data?.message ?? err?.message ?? (typeof error === 'string' ? error : undefined);
  };

  const schoolsErrorMessage = getErrorMessage(schoolsError);
  const usersErrorMessage = getErrorMessage(usersError);

  const hasAnyError = !!schoolsErrorMessage || !!usersErrorMessage;

  if (schoolsLoading || usersLoading) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  if (hasAnyError) {
    return (
      <div className="text-center text-red-600">
        {/* Show partial data if available, otherwise generic error */}
        {totalSchools > 0 || totalUsers > 0 ? (
          <div>
            <span className="text-red-600">Partial data loaded</span>
            <br />
            <small className="text-gray-400">
              {schoolsErrorMessage && 'Schools request failed: ' + schoolsErrorMessage}{' '}
              {usersErrorMessage && 'Users request failed: ' + usersErrorMessage}
            </small>
          </div>
        ) : (
          'Failed to load dashboard'
        )}
      </div>
    );
  }

  const statCards = [
    { name: 'Total Schools', value: totalSchools, color: 'bg-blue-500' },
    { name: 'Total Users', value: totalUsers, color: 'bg-green-500' },
    { name: 'Students', value: totalStudents, color: 'bg-purple-500' },
    { name: 'Teachers', value: totalTeachers, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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