import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, markAllRead } from '@/api/notifications';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { NotificationItem } from '@/components/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';

export default function CustomerNotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  useRefreshOnFocus(refetch);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  // Mark all read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark single read mutation
  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;
    markAllReadMutation.mutate();
  };

  const handleNotificationPress = (id: string, isRead: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-900 bg-slate-950">
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold">Notifications</Text>
          {unreadCount > 0 ? (
            <View className="bg-brand-500 rounded-full h-5 min-w-[20px] px-1.5 justify-center items-center ml-2.5">
              <Text className="text-white text-[10px] font-extrabold">{unreadCount}</Text>
            </View>
          ) : null}
        </View>

        {unreadCount > 0 ? (
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="flex-row items-center space-x-1 active:opacity-60"
          >
            <Ionicons name="checkmark-done" size={16} color="#818cf8" />
            <Text className="text-brand-400 text-xs font-bold">Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF7A00" />
          <Text className="text-slate-400 text-xs mt-2">Loading notifications…</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item.id, item.is_read)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="Inbox is empty"
              message="When you request services, assign workers, or receive updates, they will appear here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
