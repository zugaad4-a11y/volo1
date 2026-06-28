import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getServices, getActiveBookings } from '@/api/bookings';
import { useAuth } from '@/hooks/useAuth';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function CustomerHomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Queries
  const {
    data: servicesData,
    isLoading: servicesLoading,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['customer-services'],
    queryFn: getServices,
  });

  const {
    data: activeBookingsData,
    isLoading: bookingsLoading,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ['customer-active-bookings'],
    queryFn: getActiveBookings,
  });

  // Refetch when focused
  useRefreshOnFocus(refetchBookings);
  useRefreshOnFocus(refetchServices);

  const activeBookings = activeBookingsData?.bookings ?? [];
  const categories = servicesData?.categories ?? [];

  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: '/(customer)/bookings/create',
      params: { categoryId },
    });
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Mock icons matching standard cleaning services
  const getCategoryIcon = (name: string) => {
    const cleanName = name.toLowerCase();
    if (cleanName.includes('clean')) return 'sparkles';
    if (cleanName.includes('plumb')) return 'water';
    if (cleanName.includes('electric')) return 'flash';
    if (cleanName.includes('paint')) return 'brush';
    if (cleanName.includes('repair')) return 'build';
    return 'hammer';
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-900 bg-slate-950/80">
        <View>
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            {getGreeting()}
          </Text>
          <Text className="text-white text-xl font-bold">
            {user?.full_name || 'Guest User'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={logout}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 justify-center items-center active:bg-slate-850"
        >
          <Ionicons name="log-out-outline" size={20} color="#f43f5e" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Active Bookings Banner */}
        {activeBookings.length > 0 ? (
          <View className="mb-6">
            <Text className="text-white text-sm font-bold mb-3 flex-row items-center">
              Active Bookings <Text className="text-brand-400">({activeBookings.length})</Text>
            </Text>
            {activeBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                onPress={() => router.push(`/(customer)/bookings/${booking.id}`)}
                activeOpacity={0.9}
                className="mb-3"
              >
                <Card variant="brand" className="border-brand-500/20 bg-brand-950/10 p-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1 mr-3">
                      <Text className="text-white text-sm font-extrabold" numberOfLines={1}>
                        {booking.service_items?.name ?? 'Home Service'}
                      </Text>
                      <Text className="text-brand-350 text-xs mt-1" numberOfLines={1}>
                        Status: {booking.status.replace(/_/g, ' ').toLowerCase()}
                      </Text>
                    </View>
                    <View className="bg-brand-500/20 p-2 rounded-xl border border-brand-500/30">
                      <Ionicons name="navigate-circle-outline" size={22} color="#818cf8" />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Hero Card */}
        <Card className="bg-slate-900 border-slate-800 p-6 mb-6">
          <View className="flex-row justify-between items-center">
            <View className="flex-1 pr-4">
              <Text className="text-white text-lg font-bold mb-2">Need a Hand?</Text>
              <Text className="text-slate-400 text-xs leading-4">
                Book verified professional cleaners, plumbers, and technicians instantly.
              </Text>
            </View>
            <View className="w-20 h-20 bg-brand-500/10 rounded-2xl justify-center items-center border border-brand-500/20">
              <Ionicons name="sparkles" size={40} color="#818cf8" />
            </View>
          </View>
        </Card>

        {/* Categories Section */}
        <Text className="text-white text-base font-bold mb-4">Our Services</Text>

        {servicesLoading ? (
          <View className="py-12 justify-center items-center">
            <ActivityIndicator size="large" color="#FF7A00" />
            <Text className="text-slate-400 text-xs mt-2">Loading catalog…</Text>
          </View>
        ) : categories.length === 0 ? (
          <View className="py-12 items-center">
            <Ionicons name="alert-circle-outline" size={32} color="#64748b" />
            <Text className="text-slate-400 text-sm mt-2">No services available</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between mb-8">
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.8}
                style={{ width: '47%' }}
                className="mb-4"
              >
                <Card className="bg-slate-900 border-slate-850 p-4 items-center h-32 justify-center active:border-brand-500/30">
                  <View className="w-12 h-12 rounded-xl bg-slate-950 items-center justify-center mb-3 border border-slate-800">
                    <Ionicons
                      name={getCategoryIcon(category.name) as any}
                      size={24}
                      color="#818cf8"
                    />
                  </View>
                  <Text className="text-white text-xs font-bold text-center" numberOfLines={1}>
                    {category.name}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
