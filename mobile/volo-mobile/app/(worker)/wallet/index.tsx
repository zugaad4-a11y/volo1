import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getWorkerEarnings } from '@/api/wallet';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';

export default function WorkerWalletScreen() {
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['worker-earnings'],
    queryFn: getWorkerEarnings,
  });

  useRefreshOnFocus(refetch);

  const earnings = data?.earnings ?? { balance: 0, minimum_balance: 500 };
  const transactions = data?.transactions ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950">
        <Text className="text-white text-xl font-bold">Earnings & Wallet</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0a58ca" />
          <Text className="text-slate-400 text-xs mt-2">Loading earnings details…</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-white font-bold mt-4">Failed to load earnings</Text>
          <Text className="text-slate-400 text-xs text-center mt-2 mb-6">
            Unable to fetch wallet balance. Please check your network connection.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Earnings Card */}
          <View className="px-6 pt-6 pb-4">
            <Card variant="brand" className="border-worker-500/20 bg-worker-950/15 p-6 relative overflow-hidden">
              <View className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-worker-500/10" />

              <Text className="text-worker-300 text-xs font-bold uppercase tracking-wider mb-2">
                Commission Wallet Balance
              </Text>
              <Text className="text-white text-4xl font-extrabold mb-3">
                {formatCurrency(earnings.balance)}
              </Text>
              <Text className="text-slate-400 text-[10px] leading-4">
                Minimum required balance to stay online: <Text className="text-white font-bold">{formatCurrency(earnings.minimum_balance)}</Text>
              </Text>
            </Card>
          </View>

          {/* Transactions list */}
          <Text className="text-white text-sm font-bold px-6 py-3">Earnings History</Text>

          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            onRefresh={refetch}
            refreshing={false}
            renderItem={({ item }) => (
              <Card className="border-slate-850 bg-slate-900/60 p-4 mb-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1 mr-4">
                    <Text className="text-white text-sm font-bold" numberOfLines={1}>
                      {item.description || 'Job Settlement'}
                    </Text>
                    <Text className="text-slate-400 text-[10px] mt-1 font-medium">
                      {formatDateTime(item.created_at)}
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-extrabold ${
                      item.amount >= 0 ? 'text-emerald-400' : 'text-rose-450'
                    }`}
                  >
                    {item.amount >= 0 ? '+' : ''}
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                message="Your commissions, payouts, and job transaction entries will appear here."
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
