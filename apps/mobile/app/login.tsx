import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, type Login } from '@school-management/shared-types';
import { useAuthStore } from '@/lib/stores/auth-store';
import { api } from '@/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: Login) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;
      login(user, accessToken, refreshToken);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: 16 }}>
      <Text style={{ marginBottom: 24, fontSize: 24, fontWeight: 'bold', color: '#111827' }}>Sign In</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={{ marginBottom: 4, width: '100%', borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 }}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <Text style={{ marginBottom: 12, fontSize: 14, color: '#dc2626' }}>{errors.email.message}</Text>}
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={{ marginBottom: 4, width: '100%', borderRadius: 6, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12 }}
            placeholder="Password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password && <Text style={{ marginBottom: 12, fontSize: 14, color: '#dc2626' }}>{errors.password.message}</Text>}
      <Button title={loading ? 'Signing in...' : 'Sign In'} onPress={handleSubmit(onSubmit)} disabled={loading} />
    </View>
  );
}
