'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateAwardSchema,
  UpdateAwardSchema,
  type CreateAward,
  type UpdateAward,
  type AwardType,
} from '@school-management/shared-types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Award } from '@prisma/client';

const awardTypes: AwardType[] = ['ACADEMIC', 'SPORTS', 'CULTURAL', 'ATTENDANCE', 'OTHER'];

export default function AwardsPage() {
  const queryClient = useQueryClient();
  const [editingAward, setEditingAward] = useState<Award | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: awards, isLoading, error } = useQuery<Award[]>({
    queryKey: ['awards'],
    queryFn: async () => {
      const { data } = await api.get('/awards');
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data } = await api.get('/students');
      return data;
    },
    enabled: isCreating || !!editingAward,
  });

  const createMutation = useMutation({
    mutationFn: async (newAward: CreateAward) => {
      const { data } = await api.post('/awards', newAward);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awards'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
     mutationFn: async ({ publicId, data }: { publicId: string; data: UpdateAward }) => {
       const response = await api.patch(`/awards/${publicId}`, data);
      return response.data;
    },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['awards'] });
       setEditingAward(null);
     },
   });

   const deleteMutation = useMutation({
     mutationFn: async (publicId: string) => {
       const response = await api.delete(`/awards/${publicId}`);
       return response.data;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['awards'] });
     },
   });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAward>({
    resolver: zodResolver(CreateAwardSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<UpdateAward>({
    resolver: zodResolver(UpdateAwardSchema),
  });

  const onCreate = (data: CreateAward) => {
    createMutation.mutate(data);
  };

  const onUpdate = (data: UpdateAward) => {
    if (editingAward) {
       updateMutation.mutate({ publicId: editingAward.publicId, data });
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading awards...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load awards</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Awards</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Award
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Award</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  {...register('type')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="">Select Type</option>
                  {awardTypes.map((type) => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
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
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Awarded Date</label>
                <input
                  {...register('awardedDate', { valueAsDate: true })}
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
                {errors.awardedDate && <p className="mt-1 text-sm text-red-600">{errors.awardedDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Approved By</label>
                <input
                  {...register('approvedBy')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <input
                  {...register('status')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
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
      {editingAward && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Award</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitEdit(onUpdate)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  {...registerEdit('type')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  {awardTypes.map((type) => (
                    <option key={type} value={type}>{type.replace('_', ' ')}</option>
                  ))}
                </select>
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
                <label className="block text-sm font-medium text-gray-700">Awarded Date</label>
                <input
                  {...registerEdit('awardedDate', { valueAsDate: true })}
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Approved By</label>
                <input
                  {...registerEdit('approvedBy')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <input
                  {...registerEdit('status')}
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
                  onClick={() => { setEditingAward(null); resetEdit(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Awards List */}
      <div className="grid gap-4">
        {awards?.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No awards found. Create your first award to get started.
            </CardContent>
          </Card>
        ) : (
          awards?.map((award) => (
            <Card key={award.publicId}>
              <CardContent className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{award.title}</h3>
                  <p className="text-sm text-gray-500">
                    Student: {award.studentId} · Type: {award.type.replace('_', ' ')}
                  </p>
                  <div className="flex gap-2 mt-1">
                    <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-yellow-100 text-yellow-800">
                      {award.status}
                    </span>
                  </div>
                </div>
                 <div className="flex gap-2">
                   <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(award.publicId)} disabled={deleteMutation.isPending}>
                     <Trash2 className="h-4 w-4" />
                   </Button>
                   <Button size="sm" variant="secondary" onClick={() => setEditingAward(award)}>
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


