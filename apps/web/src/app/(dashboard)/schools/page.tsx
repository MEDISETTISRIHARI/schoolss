'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@school-management/ui-components';
import { Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateSchoolSchema, UpdateSchoolSchema, type CreateSchool, type UpdateSchool } from '@school-management/shared-types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { School } from '@prisma/client';

export default function SchoolsPage() {
  const queryClient = useQueryClient();
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: schools, isLoading, error } = useQuery<School[]>({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data } = await api.get('/schools');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newSchool: CreateSchool) => {
      const { data } = await api.post('/schools', newSchool);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
     mutationFn: async ({ publicId, data }: { publicId: string; data: UpdateSchool }) => {
       const response = await api.patch(`/schools/${publicId}`, data);
      return response.data;
    },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['schools'] });
       setEditingSchool(null);
     },
   });

   const deleteMutation = useMutation({
     mutationFn: async (publicId: string) => {
       const response = await api.delete(`/schools/${publicId}`);
       return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['schools'] });
     },
   });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSchool>({
    resolver: zodResolver(CreateSchoolSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateSchool>({
    resolver: zodResolver(UpdateSchoolSchema),
  });

  const onCreate = (data: CreateSchool) => {
    createMutation.mutate(data, {
      onSuccess: () => reset(),
    });
  };

  const onUpdate = (data: UpdateSchool) => {
    if (editingSchool) {
       updateMutation.mutate({ publicId: editingSchool.publicId, data }, {
         onSuccess: () => resetEdit(),
       });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading schools...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load schools</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Schools</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create School</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input {...register('name')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input {...register('email')} type="email" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input {...register('phone')} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
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

      {/* Edit Form */}
      {editingSchool && (
        <Card>
          <CardHeader>
            <CardTitle>Edit School</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input {...registerEdit('name')} defaultValue={editingSchool.name} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                {editErrors.name && <p className="mt-1 text-sm text-red-600">{editErrors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input {...registerEdit('email')} type="email" defaultValue={editingSchool.email || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input {...registerEdit('phone')} defaultValue={editingSchool.phone || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingSchool(null); resetEdit(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Schools List */}
      <div className="grid gap-4">
        {schools?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No schools found. Create your first school to get started.
            </CardContent>
          </Card>
        ) : (
          schools?.map((school) => (
            <Card key={school.publicId}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{school.name}</h3>
                  <p className="text-sm text-gray-500">{school.email || 'No email'}</p>
                  <p className="text-sm text-gray-500">{school.phone || 'No phone'}</p>
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${school.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {school.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                 <div className="flex gap-2">
                   <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(school.publicId)} disabled={deleteMutation.isPending}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                   <Button size="sm" variant="secondary" onClick={() => setEditingSchool(school)}>
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


