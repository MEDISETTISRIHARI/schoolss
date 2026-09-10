'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateUserSchema,
  UpdateUserSchema,
  ChangeRoleSchema,
  ChangeStatusSchema,
  type CreateUser,
  type UpdateUser,
  type ChangeRole,
  type ChangeStatus,
} from '@school-management/shared-types';
import { UserCheck, UserX, Plus, Pencil } from 'lucide-react';

import type { User } from '@prisma/client';

const roles: ('SUPER_ADMIN' | 'PRINCIPAL' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT')[] = ['SUPER_ADMIN', 'PRINCIPAL', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'];
const statuses: ('ACTIVE' | 'SUSPENDED' | 'ARCHIVED')[] = ['ACTIVE', 'SUSPENDED', 'ARCHIVED'];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [changingRoleUser, setChangingRoleUser] = useState<User | null>(null);
  const [changingStatusUser, setChangingStatusUser] = useState<User | null>(null);

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newUser: CreateUser) => {
      const { data } = await api.post('/users', newUser);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUser }) => {
      const response = await api.patch(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChangeRole }) => {
      const response = await api.patch(`/users/${id}/role`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setChangingRoleUser(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ChangeStatus }) => {
      const response = await api.patch(`/users/${id}/status`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setChangingStatusUser(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUser>({
    resolver: zodResolver(CreateUserSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateUser>({
    resolver: zodResolver(UpdateUserSchema),
  });

  const {
    register: registerRole,
    handleSubmit: handleSubmitRole,
    reset: resetRole,
    formState: { errors: roleErrors },
  } = useForm<ChangeRole>({
    resolver: zodResolver(ChangeRoleSchema),
  });

  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    reset: resetStatus,
    formState: { errors: statusErrors },
  } = useForm<ChangeStatus>({
    resolver: zodResolver(ChangeStatusSchema),
  });

  const onCreate = (data: CreateUser) => {
    createMutation.mutate(data, { onSuccess: () => reset() });
  };

  const onUpdate = (data: UpdateUser) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data }, { onSuccess: () => resetEdit() });
    }
  };

  const onRoleChange = (data: ChangeRole) => {
    if (changingRoleUser) {
      roleMutation.mutate({ id: changingRoleUser.id, data }, { onSuccess: () => resetRole() });
    }
  };

  const onStatusChange = (data: ChangeStatus) => {
    if (changingStatusUser) {
      statusMutation.mutate({ id: changingStatusUser.id, data }, { onSuccess: () => resetStatus() });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load users</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input {...register('firstName')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                  {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input {...register('lastName')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                  {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input {...register('email')} type="email" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input {...register('password')} type="password" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select {...register('role')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">School ID</label>
                <input {...register('schoolId')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setIsCreating(false); reset(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {editingUser && (
        <Card>
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input {...registerEdit('firstName')} defaultValue={editingUser.firstName} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input {...registerEdit('lastName')} defaultValue={editingUser.lastName} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input {...registerEdit('phone')} defaultValue={editingUser.phone || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingUser(null); resetEdit(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {changingRoleUser && (
        <Card>
          <CardHeader>
            <CardTitle>Change Role for {changingRoleUser.firstName} {changingRoleUser.lastName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRole(onRoleChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select {...registerRole('role')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                {roleErrors.role && <p className="mt-1 text-sm text-red-600">{roleErrors.role.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={roleMutation.isPending}>
                  {roleMutation.isPending ? 'Saving...' : 'Change Role'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setChangingRoleUser(null); resetRole(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {changingStatusUser && (
        <Card>
          <CardHeader>
            <CardTitle>Change Status for {changingStatusUser.firstName} {changingStatusUser.lastName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitStatus(onStatusChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select {...registerStatus('status')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {statusErrors.status && <p className="mt-1 text-sm text-red-600">{statusErrors.status.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={statusMutation.isPending}>
                  {statusMutation.isPending ? 'Saving...' : 'Change Status'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setChangingStatusUser(null); resetStatus(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {users?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No users found. Create your first user to get started.
            </CardContent>
          </Card>
        ) : (
          users?.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingUser(user)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setChangingRoleUser(user)}>
                    <UserCheck className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setChangingStatusUser(user)}>
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


