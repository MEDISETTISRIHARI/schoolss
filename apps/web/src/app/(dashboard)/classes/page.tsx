'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateClassSchema,
  UpdateClassSchema,
  type CreateClass,
  type UpdateClass,
} from '@school-management/shared-types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Class } from '@prisma/client';

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const { data: classes, isLoading, error } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get('/academic-years');
      return data;
    },
    enabled: isCreating || !!editingClass,
  });

  const createMutation = useMutation({
    mutationFn: async (newClass: CreateClass) => {
      const { data } = await api.post('/classes', newClass);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateClass }) => {
      const response = await api.patch(`/classes/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setEditingClass(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateClass>({
    resolver: zodResolver(CreateClassSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateClass>({
    resolver: zodResolver(UpdateClassSchema),
  });

  const onCreate = (data: CreateClass) => {
    createMutation.mutate(data, { onSuccess: () => reset() });
  };

  const onUpdate = (data: UpdateClass) => {
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data }, { onSuccess: () => resetEdit() });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading classes...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load classes</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input {...register('name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input {...register('displayName')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                <select
                  {...register('academicYearId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears?.map((ay: any) => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
                {errors.academicYearId && <p className="mt-1 text-sm text-red-600">{errors.academicYearId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
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

      {editingClass && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Class</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input {...registerEdit('name')} defaultValue={editingClass.name} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {editErrors.name && <p className="mt-1 text-sm text-red-600">{editErrors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Name</label>
                <input {...registerEdit('displayName')} defaultValue={editingClass.displayName || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                <select
                  {...registerEdit('academicYearId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears?.map((ay: any) => (
                    <option key={ay.id} value={ay.id} selected={ay.id === editingClass.academicYearId}>{ay.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...registerEdit('description')}
                  defaultValue={editingClass.description || ''}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingClass(null); resetEdit(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {classes?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No classes found. Create your first class to get started.
            </CardContent>
          </Card>
        ) : (
          classes?.map((cls) => (
            <Card key={cls.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                  {cls.displayName && <p className="text-sm text-gray-500">{cls.displayName}</p>}
                  <p className="text-sm text-gray-500">Academic Year: {cls.academicYearId}</p>
                  {cls.description && <p className="text-sm text-gray-500 mt-1">{cls.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingClass(cls)}>
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
