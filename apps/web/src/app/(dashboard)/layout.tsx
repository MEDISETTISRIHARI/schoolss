'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api';
import { Button } from '@school-management/ui-components';
import {
  LayoutDashboard,
  School,
  Users,
  Settings,
  LogOut,
  Menu,
  CalendarDays,
  BookCheck,
  Clipboard,
  Award,
  Clock,
  GraduationCap,
  BookOpen,
  Bell,
  ClipboardList,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null },
  { name: 'Schools', href: '/schools', icon: School, permission: 'school.view' },
  { name: 'Users', href: '/users', icon: Users, permission: 'users.view' },
  { name: 'Classes', href: '/classes', icon: GraduationCap, permission: 'classes.view' },
  { name: 'Sections', href: '/sections', icon: ClipboardList, permission: 'sections.view' },
  { name: 'Subjects', href: '/subjects', icon: BookOpen, permission: 'subjects.view' },
  { name: 'Students', href: '/students', icon: Users, permission: 'students.view' },
  { name: 'Teachers', href: '/teachers', icon: GraduationCap, permission: 'teachers.view' },
  { name: 'Examinations', href: '/examinations', icon: CalendarDays, permission: 'examinations.view' },
  { name: 'Marks', href: '/marks', icon: BookCheck, permission: 'marks.view' },
  { name: 'Results', href: '/results', icon: Clipboard, permission: 'results.view' },
  { name: 'Attendance', href: '/attendance', icon: Clock, permission: 'attendance.view' },
  { name: 'Homework', href: '/homework', icon: Clipboard, permission: 'homework.view' },
  { name: 'Timetable', href: '/timetable', icon: Clock, permission: 'timetable.view' },
  { name: 'Awards', href: '/awards', icon: Award, permission: 'awards.view' },
  { name: 'Notifications', href: '/notifications', icon: Bell, permission: 'notifications.view' },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['school.view', 'users.view', 'classes.view', 'sections.view', 'subjects.view', 'students.view', 'teachers.view', 'examinations.view', 'marks.view', 'results.view', 'attendance.view', 'homework.view', 'timetable.view', 'awards.view', 'notifications.view', 'settings.manage'],
  PRINCIPAL: ['school.view', 'users.view', 'classes.view', 'sections.view', 'subjects.view', 'students.view', 'teachers.view', 'examinations.view', 'marks.view', 'results.view', 'attendance.view', 'homework.view', 'timetable.view', 'awards.view', 'notifications.view', 'settings.manage'],
  SCHOOL_ADMIN: ['school.view', 'users.view', 'classes.view', 'sections.view', 'subjects.view', 'students.view', 'teachers.view', 'examinations.view', 'marks.view', 'results.view', 'attendance.view', 'homework.view', 'timetable.view', 'awards.view', 'notifications.view', 'settings.manage'],
  TEACHER: ['classes.view', 'sections.view', 'subjects.view', 'students.view', 'teachers.view', 'examinations.view', 'marks.view', 'results.view', 'attendance.view', 'homework.view', 'timetable.view', 'awards.view', 'notifications.view'],
  STUDENT: ['classes.view', 'sections.view', 'subjects.view', 'examinations.view', 'marks.view', 'results.view', 'attendance.view', 'homework.view', 'timetable.view', 'notifications.view'],
};

function getUserPermissions(role: string | undefined): string[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] || [];
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [mounted, user, router]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {
        refreshToken: useAuthStore.getState().refreshToken,
      });
    } catch {
      // Ignore logout errors
    } finally {
      logout();
      router.push('/login');
    }
  };

  const userPermissions = getUserPermissions(user?.role);

  const visibleNavigation = navigation.filter((item) => {
    if (!item.permission) return true;
    return userPermissions.includes(item.permission);
  });

  if (!mounted || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">SchoolMS</h1>
          </div>
          <nav className="mt-4 px-4 space-y-1">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
            <div className="flex items-center mb-3">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
            <button
              type="button"
              className="lg:hidden -ml-2 rounded-md p-2 text-gray-400 hover:text-gray-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {pathname.split('/')[1] || 'Dashboard'}
              </h2>
            </div>
          </div>
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
