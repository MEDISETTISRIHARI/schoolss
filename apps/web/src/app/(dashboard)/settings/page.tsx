'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@school-management/ui-components';
import { Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateSettingsSchema, type UpdateSettings } from '@school-management/shared-types';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: UpdateSettings) => {
      const { data } = await api.patch('/settings', newSettings);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateSettings>({
    resolver: zodResolver(UpdateSettingsSchema),
    values: settings,
  });

  const onSubmit = (data: UpdateSettings) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading settings...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600">Failed to load settings</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Settings (JSON)</label>
              <textarea
                {...register('settings')}
                rows={10}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                defaultValue={JSON.stringify(settings, null, 2)}
              />
              {errors.settings?.message && (<p className="mt-1 text-sm text-red-600">{String(errors.settings.message)}</p>)}
            </div>
            <Button type="submit" disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
