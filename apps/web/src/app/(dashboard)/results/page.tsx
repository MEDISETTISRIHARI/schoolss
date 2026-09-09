'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateResultSchema,
  UpdateResultSchema,
  type CreateResult,
  type UpdateResult,
} from '@school-management/shared-types';
import { Plus, Pencil } from 'lucide-react';
import { ResultStatus } from '@prisma/client';
import type { Result } from '@prisma/client';

const resultStatuses: ResultStatus[] = ['DRAFT', 'PUBLISHED', 'FINALIZED'];

export default function ResultsPage() {
  const queryClient = useQueryClient();
  const [editingResult, setEditingResult] = useState<Result | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: results, isLoading, error } = useQuery<Result[]>({
    queryKey: ['results'],
    queryFn: async () => {
      const { data } = await api.get('/results');
      return data;
    },
  });

  const { data: examinations } = useQuery({
    queryKey: ['examinations'],
    queryFn: async () => {
      const { data } = await api.get('/examinations');
      return data;
    },
    enabled: isCreating || !!editingResult,
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await api.get('/students');
      return data;
    },
    enabled: isCreating || !!editingResult,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
    enabled: isCreating || !!editingResult,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await api.get('/sections');
      return data;
    },
    enabled: isCreating || !!editingResult,
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get('/academic-years');
      return data;
    },
    enabled: isCreating || !!editingResult,
  });

  const createMutation = useMutation({
    mutationFn: async (newResult: CreateResult) => {
      const { data } = await api.post('/results', newResult);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateResult }) => {
      const response = await api.patch(`/results/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
      setEditingResult(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/results/${id}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateResult>({
    resolver: zodResolver(CreateResultSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateResult>({
    resolver: zodResolver(UpdateResultSchema),
  });

  const onCreate = (data: CreateResult) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateResult) => {
    if (editingResult) {
      updateMutation.mutate({ id: editingResult.id, data });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load results</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Results</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Result
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Result</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Examination</label>
                <select
                  {...register('examinationId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Examination (Optional)</option>
                  {examinations?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {errors.examinationId && <p className="mt-1 text-sm text-red-600">{errors.examinationId.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700">Obtained Marks</label>
                  <input
                    {...register('obtainedMarks', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.obtainedMarks && <p className="mt-1 text-sm text-red-600">{errors.obtainedMarks.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentage</label>
                  <input
                    {...register('percentage', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.percentage && <p className="mt-1 text-sm text-red-600">{errors.percentage.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <input
                    {...register('grade')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GPA</label>
                  <input
                    {...register('gpa', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CGPA</label>
                  <input
                    {...register('cgpa', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  {...register('status')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {resultStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
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
      {editingResult && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Result</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                  <select
                    {...registerEdit('academicYearId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears?.map((ay: any) => (
                      <option key={ay.id} value={ay.id}>{ay.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Examination</label>
                <select
                  {...registerEdit('examinationId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Examination (Optional)</option>
                  {examinations?.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700">Obtained Marks</label>
                  <input
                    {...registerEdit('obtainedMarks', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Percentage</label>
                  <input
                    {...registerEdit('percentage', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    max="100"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade</label>
                  <input
                    {...registerEdit('grade')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">GPA</label>
                  <input
                    {...registerEdit('gpa', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CGPA</label>
                  <input
                    {...registerEdit('cgpa', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  {...registerEdit('status')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {resultStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
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
                  onClick={() => { setEditingResult(null); resetEdit(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Results List */}
      <div className="grid gap-4">
        {results?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No results found. Create your first result to get started.
            </CardContent>
          </Card>
        ) : (
          results?.map((result) => (
            <Card key={result.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{result.studentId}</h3>
                  <p className="text-sm text-gray-500">
                    Class: {result.classId} · Academic Year: {result.academicYearId}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-blue-100 text-blue-800">
                      {Number(result.totalMarks)} / {Number(result.obtainedMarks)} marks
                    </span>
                    <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-purple-100 text-purple-800">
                      {Number(result.percentage)}%
                    </span>
                    {result.grade && (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-orange-100 text-orange-800">
                        Grade: {result.grade}
                      </span>
                    )}
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      result.status === 'FINALIZED'
                        ? 'bg-gray-100 text-gray-800'
                        : result.status === 'PUBLISHED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {result.status !== 'FINALIZED' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => approveMutation.mutate(result.id)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? '...' : 'Approve'}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setEditingResult(result)}>
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
