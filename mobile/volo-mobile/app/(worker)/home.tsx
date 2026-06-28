import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Switch } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getWorkerDashboard, getAvailableJobs, acceptJob, rejectJob, getCurrentJob } from '@/api/jobs';
import { useAuth } from '@/hooks/useAuth';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { Card } from '@/components/ui/Card';
import { JobCard } from '@/components/JobCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/utils/formatCurrency';

export default function WorkerHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  
  // State
  const [isOnline, setIsOnline] = useState(true);

  // Queries
  const {
    data: dashboardData,
    isLoading: dashLoading,
    refetch: refetchDash,
  } = useQuery({
    queryKey: ['worker-dashboard'],
    queryFn: getWorkerDashboard,
  });

  const {
    data: availableData,
    isLoading: jobsLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['worker-available-jobs'],
    queryFn: getAvailableJobs,
    enabled: isOnline,
  });

  const {
    data: activeJobData,
    isLoading: activeLoading,
    refetch: refetchActive,
  } = useQuery({
    queryKey: ['worker-active-job'],
    queryFn: getCurrentJob,
  });

  // Refetch queries on focus
  useRefreshOnFocus(refetchDash);
  useRefreshOnFocus(refetchJobs);
  useRefreshOnFocus(refetchActive);

  const stats = dashboardData?.stats ?? { today_earnings: 0, completed_today: 0, rating: 4.8 };
  const availableJobs = availableData?.jobs ?? [];
  const activeJob = activeJobData?.job ?? null;

  // Accept Mutation
  const acceptMutation = useMutation({
    mutationFn: acceptJob,
    onSuccess: (res, id) => {
      if (res.success) {
        Alert.alert('Job Accepted', 'Please proceed to the customer address.', [
          {
            text: 'Go to Job',
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ['worker-active-job'] });
              queryClient.invalidateQueries({ queryKey: ['worker-available-jobs'] });
              router.push(`/(worker)/jobs/${id}`);
            },
          },
        ]);
      }
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to accept job.');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectJob(id, 'Not interested'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-available-jobs'] });
      Alert.alert('Declined', 'Job offer declined.');
    },
  });

  const toggleOnline = () => {
    setIsOnline((prev) => !prev);
    // Best-effort push status update if API supports it
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-900 bg-slate-950/80">
        <View>
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Worker Dashboard
          </Text>
          <Text className="text-white text-xl font-bold">
            {user?.full_name || 'Partner'}
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
        {/* Status switcher */}
        <Card className="bg-slate-900 border-slate-800 p-4 mb-6 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full mr-3 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            <View>
              <Text className="text-white text-sm font-bold">Duty Status</Text>
              <Text className="text-slate-400 text-[10px] mt-0.5">
                {isOnline ? 'You are receiving new job requests' : 'You are offline'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#334155', true: '#c084fc' }}
            thumbColor={isOnline ? '#a78bfa' : '#64748b'}
          />
        </Card>

        {/* Stats Grid */}
        <View className="flex-row justify-between mb-6">
          <Card style={{ width: '47%' }} className="bg-slate-900 border-slate-850 p-4">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Earnings Today</Text>
            <Text className="text-white text-xl font-extrabold">{formatCurrency(stats.today_earnings)}</Text>
          </Card>
          <Card style={{ width: '47%' }} className="bg-slate-900 border-slate-850 p-4">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Jobs Completed</Text>
            <Text className="text-white text-xl font-extrabold">{stats.completed_today}</Text>
          </Card>
        </View>

        {/* Active Job Alert */}
        {activeJob ? (
          <TouchableOpacity
            onPress={() => router.push(`/(worker)/jobs/${activeJob.id}`)}
            activeOpacity={0.9}
            className="mb-6"
          >
            <Card variant="brand" className="border-worker-500/20 bg-worker-950/15 p-5">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-worker-300 text-[10px] font-bold uppercase tracking-wider">
                  Active Service Shift
                </Text>
                <View className="bg-worker-500/20 px-2 py-0.5 rounded border border-worker-500/30">
                  <Text className="text-worker-400 text-[10px] font-extrabold uppercase">In Progress</Text>
                </View>
              </View>
              <Text className="text-white text-base font-bold mb-2">
                {activeJob.service_items?.name ?? 'Ongoing Service'}
              </Text>
              <Text className="text-slate-350 text-xs mb-4" numberOfLines={1}>
                {activeJob.address_line}
              </Text>
              <View className="bg-worker-600 py-3 rounded-xl items-center justify-center">
                <Text className="text-white text-xs font-bold">Resume Active Job Details →</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ) : null}

        {/* Available Jobs list */}
        <Text className="text-white text-sm font-bold mb-4">Available Jobs Nearby</Text>

        {!isOnline ? (
          <Card className="bg-slate-950 border-slate-900 p-8 items-center justify-center">
            <Ionicons name="eye-off-outline" size={32} color="#64748b" className="mb-3" />
            <Text className="text-slate-400 text-sm text-center">
              Go Online to view pending jobs in your service category.
            </Text>
          </Card>
        ) : jobsLoading ? (
          <View className="py-12 justify-center items-center">
            <ActivityIndicator size="large" color="#0a58ca" />
            <Text className="text-slate-400 text-xs mt-2">Scanning nearby orders…</Text>
          </View>
        ) : availableJobs.length === 0 ? (
          <EmptyState
            icon="search-outline"
            title="Searching for jobs..."
            message="No pending job offers in your category at this moment. You will be notified when someone books!"
          />
        ) : (
          <View className="mb-10">
            {availableJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/(worker)/jobs/${job.id}`)}
                showActions
                onAccept={() => acceptMutation.mutate(job.id)}
                onReject={() => rejectMutation.mutate(job.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
