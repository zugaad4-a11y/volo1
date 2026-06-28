import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error loading this information. Please check your internet connection and try again.',
  onRetry,
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-slate-950">
      <View className="w-16 h-16 bg-red-500/10 rounded-2xl items-center justify-center mb-6 border border-red-500/20">
        <Ionicons name="alert-circle" size={36} color="#ef4444" />
      </View>
      <Text className="text-white text-xl font-bold text-center mb-2">{title}</Text>
      <Text className="text-slate-400 text-sm text-center mb-8 leading-5 max-w-[280px]">
        {message}
      </Text>
      {onRetry ? (
        <Button label={retryLabel} variant="secondary" onPress={onRetry} className="min-w-[140px]" />
      ) : null}
    </View>
  );
}
