'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateHomeworkSchema,
  UpdateHomeworkSchema,
  type CreateHomework,
  type UpdateHomework,
} from '@school-management/shared-types';
import { Plus, Pencil } from 'lucide-react';
import type { Homework } from '@prisma/client';

export default function HomeworkPage() {
  const queryClient = useQueryClient();
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: homeworks, isLoading, error } = useQuery<Homework[]>({
    queryKey: ['homework'],
    queryFn: async () => {
      const { data } = await api.get('/homework');
      return data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
    enabled: isCreating || !!editingHomework,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await api.get('/sections');
      return data;
    },
    enabled: isCreating || !!editingHomework,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/subjects');
      return data;
    },
    enabled: isCreating || !!editingHomework,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data;
    },
    enabled: isCreating || !!editingHomework,
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get('/academic-years');
      return data;
    },
    enabled: isCreating || !!editingHomework,
  });

  const createMutation = useMutation({
    mutationFn: async (newHomework: CreateHomework) => {
      const { data } = await api.post('/homework', newHomework);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHomework }) => {
      const response = await api.patch(`/homework/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
      setEditingHomework(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateHomework>({
    resolver: zodResolver(CreateHomeworkSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateHomework>({
    resolver: zodResolver(UpdateHomeworkSchema),
  });

  const onCreate = (data: CreateHomework) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateHomework) => {
    if (editingHomework) {
      updateMutation.mutate({ id: editingHomework.id, data });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading homework...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load homework</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Homework
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Homework</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class</label>
                  <select
                    {...register('classId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Class</option>
                    {classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.classId && <p className="mt-1 text-sm text-red-600">{errors.classId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <select
                    {...register('sectionId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Section (Optional)</option>
                    {sections?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    {...register('subjectId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Subject</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.subjectId && <p className="mt-1 text-sm text-red-600">{errors.subjectId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teacher</label>
                  <select
                    {...register('teacherId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Teacher</option>
                    {teachers?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.user?.firstName} {t.user?.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.teacherId && <p className="mt-1 text-sm text-red-600">{errors.teacherId.message}</p>}
                </div>
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
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  {...register('title')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  {...register('dueDate', { valueAsDate: true })}
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {errors.dueDate && <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Attachment URL</label>
                <input
                  {...register('attachmentUrl')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    {...register('isPublished')}
                    className="mr-2"
                  />
                  Is Published
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setIsCreating(false); reset(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editingHomework && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Homework</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class</label>
                  <select
                    {...registerEdit('classId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Class</option>
                    {classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <select
                    {...registerEdit('sectionId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Section (Optional)</option>
                    {sections?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    {...registerEdit('subjectId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Subject</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Teacher</label>
                  <select
                    {...registerEdit('teacherId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Teacher</option>
                    {teachers?.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.user?.firstName} {t.user?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  {...registerEdit('title')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {editErrors.title && <p className="mt-1 text-sm text-red-600">{editErrors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...registerEdit('description')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <input
                  {...registerEdit('dueDate', { valueAsDate: true })}
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Attachment URL</label>
                <input
                  {...registerEdit('attachmentUrl')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    {...registerEdit('isPublished')}
                    className="mr-2"
                    defaultChecked={editingHomework?.isPublished ?? false}
                  />
                  Is Published
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setEditingHomework(null); resetEdit(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Homework List */}
      <div className="grid gap-4">
        {homeworks?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No homework found. Create your first homework to get started.
            </CardContent>
          </Card>
        ) : (
          homeworks?.map((hw) => (
            <Card key={hw.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{hw.title}</h3>
                  <p className="text-sm text-gray-500">
                    Class: {hw.classId} · Due: {new Date(hw.dueDate).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    {hw.isPublished && (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                        Published
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingHomework(hw)}>
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
