import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth/authStore';

/**
 * Splash/index screen.
 * Checks stored token → redirects to login or home.
 * AuthGate in _layout.tsx handles the actual redirect once isLoading is false.
 */
export default function Index() {
  const { isLoading, isAuthenticated, user } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#FF7A00" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user?.role === 'worker') {
    return <Redirect href="/(worker)/home" />;
  }

  return <Redirect href="/(customer)/home" />;
}
