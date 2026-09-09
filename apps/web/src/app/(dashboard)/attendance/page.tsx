'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateAttendanceSchema,
  UpdateAttendanceSchema,
  type CreateAttendance,
  type UpdateAttendance,
  type AttendanceStatus,
} from '@school-management/shared-types';
import { Plus, Pencil } from 'lucide-react';
import type { Attendance } from '@prisma/client';

const attendanceStatuses: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: attendanceRecords, isLoading, error } = useQuery<Attendance[]>({
    queryKey: ['attendance'],
    queryFn: async () => {
      const { data } = await api.get('/attendance');
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await api.get('/students');
      return data;
    },
    enabled: isCreating || !!editingAttendance,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
    enabled: isCreating || !!editingAttendance,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await api.get('/sections');
      return data;
    },
    enabled: isCreating || !!editingAttendance,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/subjects');
      return data;
    },
    enabled: isCreating || !!editingAttendance,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data;
    },
    enabled: isCreating || !!editingAttendance,
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get('/academic-years');
      return data;
    },
    enabled: isCreating || !!editingAttendance,
  });

  const createMutation = useMutation({
    mutationFn: async (newAttendance: CreateAttendance) => {
      const { data } = await api.post('/attendance', newAttendance);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAttendance }) => {
      const response = await api.patch(`/attendance/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      setEditingAttendance(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAttendance>({
    resolver: zodResolver(CreateAttendanceSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateAttendance>({
    resolver: zodResolver(UpdateAttendanceSchema),
  });

  const onCreate = (data: CreateAttendance) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateAttendance) => {
    if (editingAttendance) {
      updateMutation.mutate({ id: editingAttendance.id, data });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading attendance...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load attendance</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Attendance
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Attendance</CardTitle>
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
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    {...register('subjectId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Subject (Optional)</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    {...register('date', { valueAsDate: true })}
                    type="date"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    {...register('status')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Status</option>
                    {attendanceStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
                </div>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    {...register('isFinalized')}
                    className="mr-2"
                  />
                  Is Finalized
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
      {editingAttendance && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Attendance</CardTitle>
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
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <select
                    {...registerEdit('subjectId')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Subject (Optional)</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  {...registerEdit('status')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {attendanceStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {editErrors.status && <p className="mt-1 text-sm text-red-600">{editErrors.status.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Remarks</label>
                <textarea
                  {...registerEdit('remarks')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    {...registerEdit('isFinalized')}
                    className="mr-2"
                    defaultChecked={editingAttendance?.isFinalized ?? false}
                  />
                  Is Finalized
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setEditingAttendance(null); resetEdit(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Attendance List */}
      <div className="grid gap-4">
        {attendanceRecords?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No attendance records found. Create your first attendance record to get started.
            </CardContent>
          </Card>
        ) : (
          attendanceRecords?.map((record) => (
            <Card key={record.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{record.studentId}</h3>
                  <p className="text-sm text-gray-500">
                    Class: {record.classId} · Date: {new Date(record.date).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      record.status === 'PRESENT'
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'ABSENT'
                        ? 'bg-red-100 text-red-800'
                        : record.status === 'LATE'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {record.status}
                    </span>
                    {record.isFinalized && (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                        Finalized
                      </span>
                    )}
                    {record.subjectId && (
                      <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-purple-100 text-purple-800">
                        {record.subjectId}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingAttendance(record)}>
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
