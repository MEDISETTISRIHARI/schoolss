'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  type CreateStudent,
  type UpdateStudent,
} from '@school-management/shared-types';
import { Plus, Pencil } from 'lucide-react';
import type { Student, User } from '@prisma/client';

type StudentWithUser = Student & {
  user: User | null;
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithUser | null>(null);

  const { data: students, isLoading, error } = useQuery<StudentWithUser[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await api.get('/students');
      return data;
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
    enabled: isCreating || !!editingStudent,
  });

  const createMutation = useMutation({
    mutationFn: async (newStudent: CreateStudent) => {
      const { data } = await api.post('/students', newStudent);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStudent }) => {
      const response = await api.patch(`/students/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setEditingStudent(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStudent>({
    resolver: zodResolver(CreateStudentSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateStudent>({
    resolver: zodResolver(UpdateStudentSchema),
  });

  const onCreate = (data: CreateStudent) => {
    createMutation.mutate(data, { onSuccess: () => reset() });
  };

  const onUpdate = (data: UpdateStudent) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data }, { onSuccess: () => resetEdit() });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading students...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load students</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User</label>
                <select
                  {...register('userId')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select User</option>
                  {users?.filter((u: any) => !u.student).map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
                {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                <input {...register('admissionNumber')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.admissionNumber && <p className="mt-1 text-sm text-red-600">{errors.admissionNumber.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input {...register('dateOfBirth', { valueAsDate: true })} type="date" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.dateOfBirth && <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>}
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
                  <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                  <input {...register('guardianName')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                  <input {...register('guardianPhone')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Email</label>
                  <input {...register('guardianEmail')} type="email" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                <input {...register('enrollmentDate', { valueAsDate: true })} type="date" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
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

      {editingStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Student</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                <input {...registerEdit('admissionNumber')} defaultValue={editingStudent.admissionNumber} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input {...registerEdit('dateOfBirth', { valueAsDate: true })} type="date" defaultValue={editingStudent.dateOfBirth ? new Date(editingStudent.dateOfBirth).toISOString().split('T')[0] : ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <input {...registerEdit('gender')} defaultValue={editingStudent.gender} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                  <input {...registerEdit('bloodGroup')} defaultValue={editingStudent.bloodGroup || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                  <input {...registerEdit('guardianName')} defaultValue={editingStudent.guardianName || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                  <input {...registerEdit('guardianPhone')} defaultValue={editingStudent.guardianPhone || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Email</label>
                  <input {...registerEdit('guardianEmail')} type="email" defaultValue={editingStudent.guardianEmail || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Guardian Relation</label>
                <input {...registerEdit('guardianRelation')} defaultValue={editingStudent.guardianRelation || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...registerEdit('address')}
                  defaultValue={editingStudent.address || ''}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingStudent(null); resetEdit(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {students?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No students found. Create your first student to get started.
            </CardContent>
          </Card>
        ) : (
          students?.map((student) => (
            <Card key={student.id}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {student.user?.firstName} {student.user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Admission: {student.admissionNumber}</p>
                  <p className="text-sm text-gray-500">Gender: {student.gender}</p>
                  <p className="text-sm text-gray-500">Guardian: {student.guardianName || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingStudent(student)}>
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
