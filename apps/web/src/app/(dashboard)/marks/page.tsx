'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateMarkSchema,
  UpdateMarkSchema,
  type CreateMark,
  type UpdateMark,
} from '@school-management/shared-types';
import { Plus, Pencil } from 'lucide-react';
import type { Mark } from '@prisma/client';

export default function MarksPage() {
  const queryClient = useQueryClient();
  const [editingMark, setEditingMark] = useState<Mark | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: marks, isLoading, error } = useQuery<Mark[]>({
    queryKey: ['marks'],
    queryFn: async () => {
      const { data } = await api.get('/marks');
      return data;
    },
  });

  const { data: examinations } = useQuery({
    queryKey: ['examinations'],
    queryFn: async () => {
      const { data } = await api.get('/examinations');
      return data;
    },
    enabled: isCreating || !!editingMark,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await api.get('/students');
      return data;
    },
    enabled: isCreating || !!editingMark,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/subjects');
      return data;
    },
    enabled: isCreating || !!editingMark,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data;
    },
    enabled: isCreating || !!editingMark,
  });

  const createMutation = useMutation({
    mutationFn: async (newMark: CreateMark) => {
      const { data } = await api.post('/marks', newMark);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMark }) => {
      const response = await api.patch(`/marks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] });
      setEditingMark(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMark>({
    resolver: zodResolver(CreateMarkSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateMark>({
    resolver: zodResolver(UpdateMarkSchema),
  });

  const onCreate = (data: CreateMark) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateMark) => {
    if (editingMark) {
      updateMutation.mutate({ id: editingMark.id, data });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading marks...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load marks</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Marks</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Mark
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Mark</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Examination</label>
                  <select
                    {...register('examinationId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Examination</option>
                    {examinations?.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  {errors.examinationId && <p className="mt-1 text-sm text-red-600">{errors.examinationId.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <select
                    {...register('studentId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Student</option>
                    {students?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.firstName} {s.user?.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.studentId && <p className="mt-1 text-sm text-red-600">{errors.studentId.message}</p>}
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
                <label className="block text-sm font-medium text-gray-700">Marks Obtained</label>
                <input
                  {...register('marksObtained', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {errors.marksObtained && <p className="mt-1 text-sm text-red-600">{errors.marksObtained.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  {...register('remarks')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {errors.remarks && <p className="mt-1 text-sm text-red-600">{errors.remarks.message}</p>}
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
      {editingMark && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Mark</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Examination</label>
                  <select
                    {...registerEdit('examinationId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Examination</option>
                    {examinations?.map((e: any) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student</label>
                  <select
                    {...registerEdit('studentId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Student</option>
                    {students?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.firstName} {s.user?.lastName}
                      </option>
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
                <label className="block text-sm font-medium text-gray-700">Marks Obtained</label>
                <input
                  {...registerEdit('marksObtained', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  {...registerEdit('remarks')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setEditingMark(null); resetEdit(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Marks List */}
      <div className="grid gap-4">
        {marks?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No marks found. Create your first mark entry to get started.
            </CardContent>
          </Card>
        ) : (
          marks?.map((mark) => (
            <Card key={mark.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{mark.studentId}</h3>
                  <p className="text-sm text-gray-500">
                    Examination: {mark.examinationId} · Subject: {mark.subjectId}
                  </p>
                  <p className="text-sm text-gray-500">Marks: {Number(mark.marksObtained)}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingMark(mark)}>
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
