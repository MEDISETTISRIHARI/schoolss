'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateTimetableEntrySchema,
  UpdateTimetableEntrySchema,
  type CreateTimetableEntry,
  type UpdateTimetableEntry,
} from '@school-management/shared-types';
import { Plus, Pencil } from 'lucide-react';
import type { TimetableEntry } from '@prisma/client';

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export default function TimetablePage() {
  const queryClient = useQueryClient();
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: timetableEntries, isLoading, error } = useQuery<TimetableEntry[]>({
    queryKey: ['timetable'],
    queryFn: async () => {
      const { data } = await api.get('/timetable');
      return data;
    },
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
    enabled: isCreating || !!editingEntry,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await api.get('/sections');
      return data;
    },
    enabled: isCreating || !!editingEntry,
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/subjects');
      return data;
    },
    enabled: isCreating || !!editingEntry,
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data } = await api.get('/teachers');
      return data;
    },
    enabled: isCreating || !!editingEntry,
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get('/academic-years');
      return data;
    },
    enabled: isCreating || !!editingEntry,
  });

  const createMutation = useMutation({
    mutationFn: async (newEntry: CreateTimetableEntry) => {
      const { data } = await api.post('/timetable', newEntry);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTimetableEntry }) => {
      const response = await api.patch(`/timetable/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
      setEditingEntry(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTimetableEntry>({
    resolver: zodResolver(CreateTimetableEntrySchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateTimetableEntry>({
    resolver: zodResolver(UpdateTimetableEntrySchema),
  });

  const onCreate = (data: CreateTimetableEntry) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateTimetableEntry) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading timetable...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load timetable</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Timetable Entry</CardTitle>
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
                <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                <select
                  {...register('dayOfWeek', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Day</option>
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
                {errors.dayOfWeek && <p className="mt-1 text-sm text-red-600">{errors.dayOfWeek.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    {...register('startTime', { valueAsDate: true })}
                    type="time"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    {...register('endTime', { valueAsDate: true })}
                    type="time"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                  {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Room Number</label>
                <input
                  {...register('roomNumber')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
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
      {editingEntry && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Timetable Entry</CardTitle>
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
                <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                <select
                  {...registerEdit('dayOfWeek', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
                {editErrors.dayOfWeek && <p className="mt-1 text-sm text-red-600">{editErrors.dayOfWeek.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    {...registerEdit('startTime', { valueAsDate: true })}
                    type="time"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    {...registerEdit('endTime', { valueAsDate: true })}
                    type="time"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Room Number</label>
                <input
                  {...registerEdit('roomNumber')}
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
                  onClick={() => { setEditingEntry(null); resetEdit(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Timetable Entries List */}
      <div className="grid gap-4">
        {timetableEntries?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No timetable entries found. Create your first entry to get started.
            </CardContent>
          </Card>
        ) : (
          timetableEntries?.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {daysOfWeek.find((d) => d.value === entry.dayOfWeek)?.label || entry.dayOfWeek}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Subject: {entry.subjectId} · Teacher: {entry.teacherId} · Class: {entry.classId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Start: {new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ·
                    End: {new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {entry.roomNumber && (
                    <p className="text-sm text-gray-500">Room: {entry.roomNumber}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingEntry(entry)}>
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
