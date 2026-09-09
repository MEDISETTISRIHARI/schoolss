'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, RoleSelectionSchema, type Login, type RoleSelection } from '@school-management/shared-types';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api';
import { Button } from '@school-management/ui-components';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PRINCIPAL: 'Principal',
  SCHOOL_ADMIN: 'School Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requiresRoleSelection, setRequiresRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [pendingLogin, setPendingLogin] = useState<{ user: any; accessToken: string; refreshToken: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
  });

  const { register: registerRole, handleSubmit: handleSubmitRole, formState: { errors: roleErrors } } = useForm<RoleSelection>({
    resolver: zodResolver(RoleSelectionSchema),
  });

  const onSubmit = async (data: Login) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken, requiresRoleSelection, availableRoles } = response.data;

      if (requiresRoleSelection && availableRoles) {
        setAvailableRoles(availableRoles);
        setPendingLogin({ user, accessToken, refreshToken });
        setRequiresRoleSelection(true);
      } else {
        login(user, accessToken, refreshToken);
        if (user.role === 'SUPER_ADMIN') {
          router.push('/');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const onRoleSubmit = async (data: RoleSelection) => {
    try {
      const response = await api.post('/auth/login', { ...pendingLogin, selectedRole: data.selectedRole });
      const { user, accessToken, refreshToken } = response.data;
      login(user, accessToken, refreshToken);
      setRequiresRoleSelection(false);
      setPendingLogin(null);
      if (user.role === 'SUPER_ADMIN') {
        router.push('/');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            {requiresRoleSelection ? 'Select Your Role' : 'Platform Admin Sign In'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {requiresRoleSelection
              ? 'Choose the role you want to use for this session'
              : 'Sign in to access platform administration'}
          </p>
        </div>

        {requiresRoleSelection ? (
          <form onSubmit={handleSubmitRole(onRoleSubmit)} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {availableRoles.map((role) => (
                <div key={role} className="flex items-center rounded-md border border-gray-300 p-3 hover:bg-gray-50">
                  <input
                    {...registerRole('selectedRole')}
                    type="radio"
                    id={role}
                    value={role}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor={role} className="ml-3 block text-sm font-medium text-gray-700">
                    {ROLE_LABELS[role] || role}
                  </label>
                </div>
              ))}
              {roleErrors.selectedRole && (
                <p className="text-sm text-red-600">{roleErrors.selectedRole.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              Continue
            </Button>
            <button
              type="button"
              onClick={() => setRequiresRoleSelection(false)}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-center text-sm text-gray-600">
              <Link href="/dashboard" className="text-primary-600 hover:text-primary-500">
                Switch to school dashboard
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
