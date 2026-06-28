import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCustomerWallet } from '@/api/wallet';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDateTime } from '@/utils/formatDate';

export default function CustomerWalletScreen() {
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['customer-wallet'],
    queryFn: getCustomerWallet,
  });

  useRefreshOnFocus(refetch);

  const wallet = data?.wallet;
  const transactions = data?.transactions ?? [];

  const handleTopUp = () => {
    Alert.alert('Top Up Wallet', 'Wallet top-ups are currently handled on the web portal. Staging gateway sync is in progress.');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950">
        <Text className="text-white text-xl font-bold">My Wallet</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF7A00" />
          <Text className="text-slate-400 text-xs mt-2">Loading wallet details…</Text>
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="text-white font-bold mt-4 text-center">Failed to load wallet</Text>
          <Text className="text-slate-400 text-xs text-center mt-2 mb-6">
            Unable to connect to the billing server. Please verify your connection.
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          {/* Wallet Balance Card */}
          <View className="px-6 pt-6 pb-4">
            <Card variant="brand" className="border-brand-500/20 bg-brand-950/15 p-6 relative overflow-hidden">
              {/* Decorative Glow */}
              <View className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-brand-500/10" />
              
              <Text className="text-brand-300 text-xs font-bold uppercase tracking-wider mb-2">
                Available Balance
              </Text>
              <Text className="text-white text-4xl font-extrabold mb-5">
                {formatCurrency(wallet?.balance ?? 0)}
              </Text>

              <TouchableOpacity
                onPress={handleTopUp}
                activeOpacity={0.8}
                className="bg-brand-500 h-11 rounded-xl flex-row items-center justify-center space-x-2 active:bg-brand-600 self-start px-5"
              >
                <Ionicons name="add-circle" size={18} color="white" />
                <Text className="text-white font-semibold text-sm">Add Funds</Text>
              </TouchableOpacity>
            </Card>
          </View>

          {/* Transactions List Header */}
          <Text className="text-white text-sm font-bold px-6 py-3">Recent Transactions</Text>

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
                      {item.description || 'Wallet Transaction'}
                    </Text>
                    <Text className="text-slate-400 text-[10px] mt-1 font-medium">
                      {formatDateTime(item.created_at)}
                    </Text>
                  </View>
                  <Text
                    className={`text-base font-extrabold ${
                      (item.amount ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-455'
                    }`}
                  >
                    {(item.amount ?? 0) >= 0 ? '+' : ''}
                    {formatCurrency(item.amount ?? 0)}
                  </Text>
                </View>
              </Card>
            )}
            ListEmptyComponent={
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                message="Your billing transactions, refunds, and top-ups will show up here."
              />
            }
          />
        </View>
      )}
    </SafeAreaView>
  );
}
