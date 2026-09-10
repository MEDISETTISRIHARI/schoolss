'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateSubjectSchema,
  UpdateSubjectSchema,
  type CreateSubject,
  type UpdateSubject,
} from '@school-management/shared-types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Subject } from '@prisma/client';

export default function SubjectsPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const { data: subjects, isLoading, error } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data } = await api.get('/subjects');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newSubject: CreateSubject) => {
      const { data } = await api.post('/subjects', newSubject);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
     mutationFn: async ({ publicId, data }: { publicId: string; data: UpdateSubject }) => {
       const response = await api.patch(`/subjects/${publicId}`, data);
      return response.data;
    },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['subjects'] });
       setEditingSubject(null);
     },
   });

   const deleteMutation = useMutation({
     mutationFn: async (publicId: string) => {
       const response = await api.delete(`/subjects/${publicId}`);
       return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['subjects'] });
     },
   });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSubject>({
    resolver: zodResolver(CreateSubjectSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateSubject>({
    resolver: zodResolver(UpdateSubjectSchema),
  });

  const onCreate = (data: CreateSubject) => {
    createMutation.mutate(data, { onSuccess: () => reset() });
  };

  const onUpdate = (data: UpdateSubject) => {
    if (editingSubject) {
       updateMutation.mutate({ publicId: editingSubject.publicId, data }, { onSuccess: () => resetEdit() });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading subjects...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load subjects</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input {...register('name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input {...register('code')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
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

      {editingSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Subject</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input {...registerEdit('name')} defaultValue={editingSubject.name} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {editErrors.name && <p className="mt-1 text-sm text-red-600">{editErrors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input {...registerEdit('code')} defaultValue={editingSubject.code || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...registerEdit('description')}
                  defaultValue={editingSubject.description || ''}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingSubject(null); resetEdit(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {subjects?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No subjects found. Create your first subject to get started.
            </CardContent>
          </Card>
        ) : (
          subjects?.map((subject) => (
            <Card key={subject.publicId}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                  {subject.code && <p className="text-sm text-gray-500">Code: {subject.code}</p>}
                  {subject.description && <p className="text-sm text-gray-500 mt-1">{subject.description}</p>}
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${subject.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {subject.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                 <div className="flex gap-2">
                   <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(subject.publicId)} disabled={deleteMutation.isPending}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                   <Button size="sm" variant="secondary" onClick={() => setEditingSubject(subject)}>
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


