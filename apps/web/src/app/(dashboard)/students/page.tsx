'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateStudentWithUserSchema,
  UpdateStudentSchema,
  type CreateStudentWithUser,
  type UpdateStudent,
} from '@school-management/shared-types';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import type { Student, User, Class, Section, AcademicYear } from '@prisma/client';

type StudentWithUser = Student & {
  user: User | null;
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentWithUser | null>(null);
  const [searchName, setSearchName] = useState('');
  const [searchAdmission, setSearchAdmission] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: students, isLoading, error } = useQuery<StudentWithUser[]>({
    queryKey: ['students', searchName, searchAdmission, filterClass, filterSection, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchName) params.set('search', searchName);
      if (searchAdmission) params.set('admissionNumber', searchAdmission);
      if (filterClass) params.set('classId', filterClass);
      if (filterSection) params.set('sectionId', filterSection);
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/students?${params.toString()}`);
      return data;
    },
  });

  const { data: classes } = useQuery<Class[]>({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data } = await api.get('/classes');
      return data;
    },
    enabled: isCreating,
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data } = await api.get('/sections');
      return data;
    },
    enabled: isCreating,
  });

  const { data: academicYears } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data } = await api.get('/academic-years');
      return data;
    },
    enabled: isCreating,
  });

  const createMutation = useMutation({
    mutationFn: async (newStudent: CreateStudentWithUser) => {
      const { data } = await api.post('/students/with-user', newStudent);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsCreating(false);
      reset();
    },
  });

  const updateMutation = useMutation({
     mutationFn: async ({ publicId, data }: { publicId: string; data: UpdateStudent }) => {
       const response = await api.patch(`/students/${publicId}`, data);
      return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['students'] });
       setEditingStudent(null);
     },
   });

   const deleteMutation = useMutation({
     mutationFn: async (publicId: string) => {
       const response = await api.delete(`/students/${publicId}`);
       return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['students'] });
     },
   });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStudentWithUser>({
    resolver: zodResolver(CreateStudentWithUserSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateStudent>({
    resolver: zodResolver(UpdateStudentSchema),
  });

  const onCreate = (data: CreateStudentWithUser) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateStudent) => {
    if (editingStudent) {
       updateMutation.mutate({ publicId: editingStudent.publicId, data }, { onSuccess: () => resetEdit() });
    }
  };

  const getClassDisplay = (classId: string) => {
    const cls = classes?.find((c: any) => c.id === classId);
    return cls?.name || classId;
  };

  const getSectionDisplay = (sectionId: string) => {
    const section = sections?.find((s: any) => s.id === sectionId);
    return section?.name || sectionId;
  };

  const getAcademicYearDisplay = (academicYearId: string) => {
    const ay = academicYears?.find((a: any) => a.id === academicYearId);
    return ay?.name || academicYearId;
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input {...register('phone')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input {...register('password')} type="password" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                  <input {...register('bloodGroup')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                  <input {...register('guardianName')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                  <input {...register('guardianPhone')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Guardian Email</label>
                <input {...register('guardianEmail')} type="email" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  {...register('address')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
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
                    <option value="">Select Section</option>
                    {sections?.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.sectionId && <p className="mt-1 text-sm text-red-600">{errors.sectionId.message}</p>}
                </div>
              </div>
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
                  <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                  <input {...register('rollNumber')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
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

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          {searchName && <button onClick={() => setSearchName('')} className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>}
        </div>
        <div>
          <input
            type="text"
            placeholder="Search by admission number..."
            value={searchAdmission}
            onChange={(e) => setSearchAdmission(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2"
          />
          {searchAdmission && <button onClick={() => setSearchAdmission('')} className="text-gray-500 hover:text-gray-700 ml-2"><X className="h-4 w-4" /></button>}
        </div>
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Classes</option>
          {classes?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Sections</option>
          {sections?.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div className="grid gap-4">
        {students?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No students found. Create your first student to get started.
            </CardContent>
          </Card>
        ) : (
          students?.map((student) => (
            <Card key={student.publicId}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {student.user?.firstName} {student.user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">Admission: {student.admissionNumber}</p>
                  <p className="text-sm text-gray-500">Gender: {student.gender}</p>
                  <p className="text-sm text-gray-500">Guardian: {student.guardianName || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Enrolled: {new Date(student.enrollmentDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Status: {student.user?.status || 'N/A'}</p>
                </div>
                 <div className="flex gap-2">
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(student.publicId)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
