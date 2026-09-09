'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@school-management/ui-components';
import { Bell, BookOpen, FileText, CheckSquare, Award, Target } from 'lucide-react';
import type { Notification, NotificationType } from '@school-management/shared-types';

const notificationIcons: Record<string, React.ReactNode> = {
  ANNOUNCEMENT: <Bell className="h-5 w-5" />,
  HOMEWORK: <BookOpen className="h-5 w-5" />,
  EXAMINATION: <FileText className="h-5 w-5" />,
  RESULT: <CheckSquare className="h-5 w-5" />,
  ATTENDANCE: <Award className="h-5 w-5" />,
  AWARD: <Award className="h-5 w-5" />,
  GENERAL: <Bell className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  ANNOUNCEMENT: 'bg-blue-100 text-blue-800',
  HOMEWORK: 'bg-purple-100 text-purple-800',
  EXAMINATION: 'bg-orange-100 text-orange-800',
  RESULT: 'bg-green-100 text-green-800',
  ATTENDANCE: 'bg-yellow-100 text-yellow-800',
  AWARD: 'bg-pink-100 text-pink-800',
  GENERAL: 'bg-gray-100 text-gray-800',
};

export default function NotificationsPage() {
  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data;
    },
  });

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading notifications...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load notifications</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      </div>

      {notifications?.length === 0 ? (
        <Card>
          <CardContent className="text-center text-gray-500 py-8">
            No notifications found.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications?.map((notification) => (
            <Card key={notification.id}>
              <CardContent className="flex items-start gap-4">
                <div className={`mt-1 rounded-full p-2 ${typeColors[notification.type as string] || typeColors.GENERAL}`}>
                  {notificationIcons[notification.type as string] || notificationIcons.GENERAL}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${typeColors[notification.type as string] || typeColors.GENERAL}`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.body}</p>
                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      {Object.entries(notification.data).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                    <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                    {notification.isSchoolWide && (
                      <span className="inline-flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        School-wide
                      </span>
                    )}
                    {notification.publishedAt && (
                      <span>Published: {new Date(notification.publishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
