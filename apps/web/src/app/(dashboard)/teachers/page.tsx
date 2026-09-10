'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateTeacherSchema,
  UpdateTeacherSchema,
  type CreateTeacher,
  type UpdateTeacher,
} from '@school-management/shared-types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { User } from '@prisma/client';

type TeacherWithUser = {
  id: string;
  publicId: string;
  userId: string;
  employeeId: string;
  dateOfBirth: Date;
  gender: string;
  bloodGroup: string | null;
  address: string | null;
  qualification: string | null;
  experience: number | null;
  joiningDate: Date;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    schoolId: string | null;
  } | null;
};

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithUser | null>(null);

  const { data: teachers, isLoading, error } = useQuery<TeacherWithUser[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data;
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: isCreating || !!editingTeacher,
  });

  const createMutation = useMutation({
    mutationFn: async (newTeacher: CreateTeacher) => {
      const { data } = await api.post('/teachers', newTeacher);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
     mutationFn: async ({ publicId, data }: { publicId: string; data: UpdateTeacher }) => {
       const response = await api.patch(`/teachers/${publicId}`, data);
      return response.data;
    },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['teachers'] });
       setEditingTeacher(null);
     },
   });

   const deleteMutation = useMutation({
     mutationFn: async (publicId: string) => {
       const response = await api.delete(`/teachers/${publicId}`);
       return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['teachers'] });
     },
   });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeacher & { userId: string }>({
    resolver: zodResolver(CreateTeacherSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateTeacher>({
    resolver: zodResolver(UpdateTeacherSchema),
  });

  const onCreate = (data: CreateTeacher & { userId: string }) => {
    createMutation.mutate(data, { onSuccess: () => reset() });
  };

  const onUpdate = (data: UpdateTeacher) => {
    if (editingTeacher) {
       updateMutation.mutate({ publicId: editingTeacher.publicId, data }, { onSuccess: () => resetEdit() });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading teachers...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load teachers</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <select
                  {...register('userId', { required: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select User</option>
                  {users?.filter((u: any) => !('teacher' in u)).map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
                {errors.userId && <p className="mt-1 text-sm text-red-600">User is required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input {...register('employeeId')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.employeeId && <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input {...register('dateOfBirth', { valueAsDate: true })} type="date" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  {...register('gender')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                  <input {...register('bloodGroup')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Qualification</label>
                  <input {...register('qualification')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                  <input {...register('experience', { valueAsNumber: true })} type="number" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                  <input {...register('joiningDate', { valueAsDate: true })} type="date" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
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

      {editingTeacher && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Teacher</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input {...registerEdit('employeeId')} defaultValue={editingTeacher.employeeId} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qualification</label>
                <input {...registerEdit('qualification')} defaultValue={editingTeacher.qualification || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                <input {...registerEdit('experience', { valueAsNumber: true })} type="number" defaultValue={editingTeacher.experience || 0} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...registerEdit('address')}
                  defaultValue={editingTeacher.address || ''}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingTeacher(null); resetEdit(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {teachers?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No teachers found. Create your first teacher to get started.
            </CardContent>
          </Card>
        ) : (
          teachers?.map((teacher) => (
            <Card key={teacher.publicId}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {teacher.user?.firstName} {teacher.user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Employee ID: {teacher.employeeId}</p>
                  <p className="text-sm text-gray-500">Email: {teacher.user?.email}</p>
                  <p className="text-sm text-gray-500">Qualification: {teacher.qualification || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Experience: {teacher.experience ? `${teacher.experience} years` : 'N/A'}</p>
                </div>
                 <div className="flex gap-2">
                   <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(teacher.publicId)} disabled={deleteMutation.isPending}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                   <Button size="sm" variant="secondary" onClick={() => setEditingTeacher(teacher)}>
                     <Pencil className="h-4 w-4" />
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


