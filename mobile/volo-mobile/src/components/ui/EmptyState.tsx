import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.prototype.props | string;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title = 'No items found',
  message = 'There is nothing to display here at the moment.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center p-6 bg-slate-950">
      <View className="w-16 h-16 bg-slate-900 rounded-2xl items-center justify-center mb-6 border border-slate-800">
        <Ionicons name={icon as any} size={32} color="#64748b" />
      </View>
      <Text className="text-white text-lg font-bold text-center mb-2">{title}</Text>
      <Text className="text-slate-400 text-sm text-center mb-8 leading-5 max-w-[280px]">
        {message}
      </Text>
      {onAction && actionLabel ? (
        <Button label={actionLabel} variant="primary" onPress={onAction} className="min-w-[140px]" />
      ) : null}
    </View>
  );
}
