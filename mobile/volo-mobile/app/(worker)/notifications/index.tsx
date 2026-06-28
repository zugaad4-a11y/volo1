import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead, markAllRead } from '@/api/notifications';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { NotificationItem } from '@/components/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WorkerNotificationsScreen() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  useRefreshOnFocus(refetch);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

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
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-900 bg-slate-950">
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold">Notifications</Text>
          {unreadCount > 0 ? (
            <View className="bg-worker-600 rounded-full h-5 min-w-[20px] px-1.5 justify-center items-center ml-2.5">
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
            <Ionicons name="checkmark-done" size={16} color="#c084fc" />
            <Text className="text-worker-400 text-xs font-bold">Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0a58ca" />
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
              message="Important updates regarding jobs, payouts, and compliance checks will be logged here."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
