import { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAvailableJobs } from '@/api/jobs';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { JobCard } from '@/components/JobCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WorkerJobsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['worker-jobs-list', activeTab],
    queryFn: getAvailableJobs, // Filters or falls back
  });

  useRefreshOnFocus(refetch);

  const jobs = data?.jobs ?? [];

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 border-b border-slate-900 bg-slate-950">
        <Text className="text-white text-xl font-bold">Job Offers</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 py-3 border-b border-slate-900/60 bg-slate-950">
        <TouchableOpacity
          onPress={() => setActiveTab('available')}
          className={`flex-1 pb-2 items-center ${activeTab === 'available' ? 'border-b-2 border-worker-500' : ''}`}
        >
          <Text className={`text-sm font-semibold ${activeTab === 'available' ? 'text-white' : 'text-slate-400'}`}>
            Pending Offers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          className={`flex-1 pb-2 items-center ${activeTab === 'history' ? 'border-b-2 border-worker-500' : ''}`}
        >
          <Text className={`text-sm font-semibold ${activeTab === 'history' ? 'text-white' : 'text-slate-400'}`}>
            Active / Past Shifts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center bg-slate-950">
          <ActivityIndicator size="large" color="#0a58ca" />
          <Text className="text-slate-400 text-xs mt-2">Loading job offers…</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/(worker)/jobs/${item.id}`)}
            />
          )}
          onRefresh={refetch}
          refreshing={false}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-outline"
              title={activeTab === 'available' ? 'No pending offers' : 'No history found'}
              message={
                activeTab === 'available'
                  ? "There are no pending jobs in your area at the moment. Keep status 'Online' to receive notifications."
                  : 'You have not done any shifts yet.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

import { TouchableOpacity } from 'react-native';
