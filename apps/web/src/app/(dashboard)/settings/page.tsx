'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@school-management/ui-components';
import { Button } from '@school-management/ui-components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateSettingsSchema, type UpdateSettings } from '@school-management/shared-types';
import { Save, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settingsResponse, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings');
      return data;
    },
  });

  // Backend returns { platform: {...} } for SUPER_ADMIN or { school: {...} } for school-level
  const rawSettings = settingsResponse?.platform || settingsResponse?.school || {};

  // Stringify settings for the textarea
  const defaultSettingsString = JSON.stringify(rawSettings, null, 2);

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
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateSettings>({
    resolver: zodResolver(UpdateSettingsSchema),
    mode: 'onSubmit',
    defaultValues: { settings: rawSettings },
  });

  // Watch the textarea value and parse JSON for form submission
  const settingsString = watch('settings');

  const onSubmit = (data: UpdateSettings) => {
    // Parse the JSON string to object before sending
    try {
      const parsed = typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings;
      updateMutation.mutate({ settings: parsed });
    } catch (e) {
      // Error will be caught by form validation
      console.error('Invalid JSON:', e);
    }
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading settings...</div>;
  }

  if (error) {
    const err = error as any;
    const message = err?.response?.data?.message || err?.message || 'Failed to load settings';
    return <div className="text-center text-red-600">{message}</div>;
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
                {...register('settings', {
                  onChange: (e) => {
                    const value = e.target.value;
                    setValue('settings', value, { shouldValidate: true });
                  },
                })}
                rows={15}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
                placeholder="{}"
              />
              {errors.settings && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {String(errors.settings.message)}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 text-xs">
                Current settings:
              </label>
              <pre
                className="mt-2 rounded-md p-2 text-xs overflow-x-auto bg-gray-50"
              >
                {JSON.stringify(rawSettings, null, 2)}
              </pre>
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