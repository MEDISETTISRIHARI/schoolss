'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateExaminationSchema,
  UpdateExaminationSchema,
  type CreateExamination,
  type UpdateExamination,
} from '@school-management/shared-types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Examination } from '@prisma/client';

const ExaminationType = {
  MID_TERM: 'MID_TERM',
  FINAL: 'FINAL',
  QUIZ: 'QUIZ',
  ASSIGNMENT: 'ASSIGNMENT',
  PROJECT: 'PROJECT',
  PRACTICAL: 'PRACTICAL',
  ORAL: 'ORAL',
};
import { useAuthStore } from '@/lib/stores/auth-store';

export default function ExaminationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [editingExam, setEditingExam] = useState<Examination | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data: examinations, isLoading, error } = useQuery<Examination[]>({
    queryKey: ['examinations'],
    queryFn: async () => {
      const { data } = await api.get('/examinations');
      return data;
    },
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get('/academic-years');
      return data;
    },
    enabled: isCreating || !!editingExam,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
    enabled: isCreating || !!editingExam,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/subjects');
      return data;
    },
    enabled: isCreating || !!editingExam,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await api.get('/sections');
      return data;
    },
    enabled: isCreating || !!editingExam,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data;
    },
    enabled: isCreating || !!editingExam,
  });

  const createMutation = useMutation({
    mutationFn: async (newExamination: CreateExamination) => {
      const { data } = await api.post('/examinations', newExamination);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examinations'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
     mutationFn: async ({ publicId, data }: { publicId: string; data: UpdateExamination }) => {
       const response = await api.patch(`/examinations/${publicId}`, data);
      return response.data;
    },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['examinations'] });
       setEditingExam(null);
     },
   });

   const deleteMutation = useMutation({
     mutationFn: async (publicId: string) => {
       const response = await api.delete(`/examinations/${publicId}`);
       return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['examinations'] });
     },
   });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExamination>({
    resolver: zodResolver(CreateExaminationSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateExamination>({
    resolver: zodResolver(UpdateExaminationSchema),
  });

  const onCreate = (data: CreateExamination) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateExamination) => {
    if (editingExam) {
       updateMutation.mutate({ publicId: editingExam.publicId, data });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading examinations...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load examinations</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Examination
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Examination</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  {errors.sectionId && <p className="mt-1 text-sm text-red-600">{errors.sectionId.message}</p>}
                </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    {...register('type')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Type</option>
                    {Object.values(ExaminationType).map((type) => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                  {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    {...register('date', { valueAsDate: true })}
                    type="date"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Marks</label>
                  <input
                    {...register('totalMarks', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.totalMarks && <p className="mt-1 text-sm text-red-600">{errors.totalMarks.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passing Marks</label>
                  <input
                    {...register('passingMarks', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.passingMarks && <p className="mt-1 text-sm text-red-600">{errors.passingMarks.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teacher</label>
                <select
                  {...register('teacherId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Teacher (Optional)</option>
                  {teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.user?.firstName} {t.user?.lastName}
                    </option>
                  ))}
                </select>
                {errors.teacherId && <p className="mt-1 text-sm text-red-600">{errors.teacherId.message}</p>}
              </div>

              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">School</label>
                  <input
                    {...register('schoolId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    placeholder="School ID"
                  />
                </div>
              )}

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
      {editingExam && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Examination</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <select
                    {...registerEdit('academicYearId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears?.map((ay: any) => (
                      <option key={ay.id} value={ay.id} defaultValue={editingExam.academicYearId}>
                        {ay.name}
                      </option>
                    ))}
                  </select>
                  {editErrors.academicYearId && <p className="mt-1 text-sm text-red-600">{editErrors.academicYearId.message}</p>}
                </div>
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
                  {editErrors.classId && <p className="mt-1 text-sm text-red-600">{editErrors.classId.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  {...registerEdit('name')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    {...registerEdit('type')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    {Object.values(ExaminationType).map((type) => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    {...registerEdit('date', { valueAsDate: true })}
                    type="date"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Marks</label>
                  <input
                    {...registerEdit('totalMarks', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Passing Marks</label>
                  <input
                    {...registerEdit('passingMarks', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Teacher</label>
                <select
                  {...registerEdit('teacherId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Teacher (Optional)</option>
                  {teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.user?.firstName} {t.user?.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setEditingExam(null); resetEdit(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Examinations List */}
      <div className="grid gap-4">
        {examinations?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No examinations found. Create your first examination to get started.
            </CardContent>
          </Card>
        ) : (
          examinations?.map((exam) => (
            <Card key={exam.publicId}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                  <p className="text-sm text-gray-500">
                    {exam.classId} · {exam.subjectId} · {new Date(exam.date).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                      {exam.type.replace('_', ' ')}
                    </span>
                    <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-purple-100 text-purple-800">
                      {exam.totalMarks} marks
                    </span>
                    {exam.isPublished && (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-green-100 text-green-800">
                        Published
                      </span>
                    )}
                    {exam.isFinalized && (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                        Finalized
                      </span>
                    )}
                  </div>
                </div>
                 <div className="flex gap-2">
                   <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(exam.publicId)} disabled={deleteMutation.isPending}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                   <Button size="sm" variant="secondary" onClick={() => setEditingExam(exam)}>
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


