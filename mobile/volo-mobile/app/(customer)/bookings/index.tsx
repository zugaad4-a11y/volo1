import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getActiveBookings, getBookingHistory } from '@/api/bookings';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

export default function BookingsListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Queries
  const {
    data: activeData,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['active-bookings'],
    queryFn: getActiveBookings,
    enabled: activeTab === 'active',
  });

  const {
    data: historyData,
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['booking-history'],
    queryFn: getBookingHistory,
    enabled: activeTab === 'history',
  });

  // Refresh active tab query when focused
  useRefreshOnFocus(refetchActive);
  useRefreshOnFocus(refetchHistory);

  const bookings = activeTab === 'active' ? activeData?.bookings ?? [] : historyData?.bookings ?? [];
  const loading = activeTab === 'active' ? activeLoading : historyLoading;
  const refetch = activeTab === 'active' ? refetchActive : refetchHistory;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950">
        <Text className="text-white text-xl font-bold">My Bookings</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 py-3 border-b border-slate-900/60 bg-slate-950">
        <TouchableOpacity
          onPress={() => setActiveTab('active')}
          className={`flex-1 pb-2 items-center ${activeTab === 'active' ? 'border-b-2 border-brand-500' : ''}`}
        >
          <Text className={`text-sm font-semibold ${activeTab === 'active' ? 'text-white' : 'text-slate-400'}`}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          className={`flex-1 pb-2 items-center ${activeTab === 'history' ? 'border-b-2 border-brand-500' : ''}`}
        >
          <Text className={`text-sm font-semibold ${activeTab === 'history' ? 'text-white' : 'text-slate-400'}`}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center bg-slate-950">
          <ActivityIndicator size="large" color="#FF7A00" />
          <Text className="text-slate-400 text-xs mt-2">Loading bookings…</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onPress={() => router.push(`/(customer)/bookings/${item.id}`)}
            />
          )}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <EmptyState
              icon={activeTab === 'active' ? 'calendar-outline' : 'file-tray-outline'}
              title={activeTab === 'active' ? 'No active bookings' : 'No booking history'}
              message={
                activeTab === 'active'
                  ? "You don't have any pending or active jobs right now. Book a service to get started!"
                  : "You haven't completed any bookings yet."
              }
              actionLabel={activeTab === 'active' ? 'Book Now' : undefined}
              onAction={activeTab === 'active' ? () => router.push('/(customer)/home') : undefined}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
