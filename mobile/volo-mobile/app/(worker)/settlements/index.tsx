import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getSettlements } from '@/api/settlements';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

export default function WorkerSettlementsScreen() {
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['worker-settlements'],
    queryFn: getSettlements,
  });

  useRefreshOnFocus(refetch);

  const settlements = data?.settlements ?? [];
  const totalPayout = data?.total ?? 0;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PROCESSING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950">
        <Text className="text-white text-xl font-bold">Settlement Ledger</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0a58ca" />
          <Text className="text-slate-400 text-xs mt-2">Loading payouts…</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-white font-bold mt-4">Failed to load ledger</Text>
          <Text className="text-slate-400 text-xs text-center mt-2 mb-6">
            Unable to fetch settlements from bank registry.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Total Settlements Summary */}
          <View className="px-6 pt-6 pb-4">
            <Card variant="brand" className="border-worker-500/20 bg-worker-950/15 p-6 relative overflow-hidden">
              {/* Decorative Glow */}
              <View className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-worker-500/10" />

              <Text className="text-worker-300 text-xs font-bold uppercase tracking-wider mb-2">
                Total Payouts Settled
              </Text>
              <Text className="text-white text-4xl font-extrabold">
                {formatCurrency(totalPayout)}
              </Text>
            </Card>
          </View>

          {/* Settlements List */}
          <Text className="text-white text-sm font-bold px-6 py-3">Payout Cycles</Text>

          <FlatList
            data={settlements}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            onRefresh={refetch}
            refreshing={false}
            renderItem={({ item }) => (
              <Card className="border-slate-850 bg-slate-900/60 p-4 mb-3">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white text-sm font-bold">
                    Week Ending: {formatDate(item.week_end_date)}
                  </Text>
                  <Badge
                    label={item.status}
                    variant={getStatusVariant(item.status)}
                    size="sm"
                  />
                </View>
                <View className="flex-row justify-between items-center mt-1">
                  <Text className="text-slate-400 text-xs">
                    Payout ID: {item.razorpayx_payout_id || 'Local Transfer'}
                  </Text>
                  <Text className="text-white text-base font-extrabold">
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="card-outline"
                title="No payouts recorded"
                message="Your weekly settlement payouts will be logged here once completed."
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
