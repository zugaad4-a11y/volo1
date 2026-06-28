import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Platform, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getJobById, acceptJob, rejectJob, startJob, completeJob } from '@/api/jobs';
import { pushWorkerLocation } from '@/api/tracking';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { usePolling } from '@/hooks/usePolling';
import { BookingStatus } from '@volo/shared-types';

export default function WorkerJobDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  // States
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Job Query
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['worker-job-detail', id],
    queryFn: () => getJobById(id),
  });

  const job = data?.job;

  // Track worker GPS position on active job
  useEffect(() => {
    let watchId: any = null;
    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // 10 meters
        },
        (loc) => {
          setCurrentCoords({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });

          // Send update to server if job is active
          if (
            job &&
            [BookingStatus.ON_THE_WAY, BookingStatus.IN_PROGRESS].includes(job.status)
          ) {
            pushWorkerLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              accuracy: loc.coords.accuracy ?? undefined,
              speed: loc.coords.speed ?? undefined,
              heading: loc.coords.heading ?? undefined,
              deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
            }).catch(console.error);
          }
        }
      );
    };

    if (
      job &&
      [BookingStatus.WORKER_ACCEPTED, BookingStatus.ON_THE_WAY, BookingStatus.ARRIVED, BookingStatus.IN_PROGRESS].includes(
        job.status
      )
    ) {
      startTracking();
    }

    return () => {
      if (watchId) watchId.remove();
    };
  }, [job?.status]);

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: () => acceptJob(id),
    onSuccess: () => {
      Alert.alert('Job Accepted', 'Ready to start your shift.');
      queryClient.invalidateQueries({ queryKey: ['worker-job-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['worker-dashboard'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to accept job.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectJob(id, 'Decline offer'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worker-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['worker-available-jobs'] });
      router.back();
    },
  });

  // State Transition Actions
  const updateStatusMutation = useMutation({
    mutationFn: async (targetStatus: BookingStatus) => {
      // Simulate status transition over generic backend action if endpoint exists
      // Standard flow:
      // WORKER_ACCEPTED -> ON_THE_WAY (Start Journey)
      // ON_THE_WAY -> ARRIVED (Arrived at customer)
      // ARRIVED -> Enter OTP + verify
      // IN_PROGRESS -> COMPLETE
    },
  });

  const handleStartJourney = async () => {
    setActionLoading(true);
    try {
      // Typically calls backend state transition
      // We will perform a refresh/mock state transition for mock flow
      Alert.alert('Journey Started', 'Active GPS tracking started. Customer can now track your route.');
      refetch();
    } catch {
      Alert.alert('Error', 'Failed to update job status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkArrived = async () => {
    setActionLoading(true);
    try {
      Alert.alert('Arrived', 'You have arrived. Please request the customer for the verification PIN.');
      refetch();
    } catch {
      Alert.alert('Error', 'Failed to update job status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartJob = async () => {
    if (otp.length !== 4) {
      setOtpError('Please enter the 4-digit code.');
      return;
    }
    setOtpError('');
    setActionLoading(true);
    try {
      const res = await startJob(id, otp);
      if (res.success) {
        Alert.alert('Job Started', 'Shift started successfully.');
        queryClient.invalidateQueries({ queryKey: ['worker-job-detail', id] });
      } else {
        setOtpError('Invalid verification code.');
      }
    } catch (err: any) {
      setOtpError(err?.response?.data?.error ?? 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    setActionLoading(true);
    try {
      const res = await completeJob(id);
      if (res.success) {
        Alert.alert('Job Completed', 'Congratulations on completing this shift!', [
          {
            text: 'Finish',
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ['worker-dashboard'] });
              router.replace('/(worker)/home');
            },
          },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Completion Failed', err?.response?.data?.error ?? 'Failed to complete job.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call.');
    });
  };

  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED:
        return 'success';
      case BookingStatus.CANCELLED:
        return 'error';
      case BookingStatus.WORKER_ASSIGNED:
        return 'warning';
      default:
        return 'brand';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    return status.replace(/_/g, ' ').toLowerCase();
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950">
        <ActivityIndicator size="large" color="#0a58ca" />
        <Text className="text-slate-400 text-xs mt-2">Loading job details…</Text>
      </View>
    );
  }

  if (isError || !job) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950 px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-white text-lg font-bold mt-4">Job Not Found</Text>
        <Button label="Back to Dashboard" onPress={() => router.back()} />
      </View>
    );
  }

  // Determine current active workflow button
  const renderWorkflowButton = () => {
    if (actionLoading) {
      return (
        <View className="h-14 justify-center items-center bg-slate-900 rounded-xl">
          <ActivityIndicator color="#0a58ca" />
        </View>
      );
    }

    switch (job.status) {
      case BookingStatus.WORKER_ASSIGNED:
        return (
          <View className="flex-row space-x-3 mb-8">
            <TouchableOpacity
              onPress={() => rejectMutation.mutate()}
              className="flex-1 h-14 border border-slate-800 rounded-xl items-center justify-center active:bg-slate-900"
            >
              <Text className="text-slate-400 font-semibold text-base">Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => acceptMutation.mutate()}
              className="flex-1 h-14 bg-worker-600 rounded-xl items-center justify-center active:bg-worker-700"
            >
              <Text className="text-white font-semibold text-base">Accept Shift</Text>
            </TouchableOpacity>
          </View>
        );

      case BookingStatus.WORKER_ACCEPTED:
        return (
          <Button
            label="Start Journey →"
            onPress={handleStartJourney}
            className="bg-worker-600 active:bg-worker-700 h-14 mb-8"
          />
        );

      case BookingStatus.ON_THE_WAY:
        return (
          <Button
            label="Arrived at Location"
            onPress={handleMarkArrived}
            className="bg-emerald-600 active:bg-emerald-700 h-14 mb-8"
          />
        );

      case BookingStatus.ARRIVED:
        return (
          <Card className="bg-slate-900 border-slate-850 p-5 mb-8">
            <Text className="text-white text-sm font-bold mb-1">Verify Start OTP</Text>
            <Text className="text-slate-400 text-xs mb-4">
              Enter the 4-digit code provided by the customer to start work.
            </Text>
            
            <View className="flex-row space-x-3 mb-4">
              <TextInput
                placeholder="4-digit PIN"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
                maxLength={4}
                value={otp}
                onChangeText={setOtp}
                className="flex-1 h-13 px-4 rounded-xl border bg-slate-950 text-white text-center text-lg font-bold border-slate-800 focus:border-worker-500"
              />
              <TouchableOpacity
                onPress={handleStartJob}
                className="bg-worker-600 h-13 px-6 rounded-xl justify-center items-center active:bg-worker-700"
              >
                <Text className="text-white font-semibold text-sm">Verify</Text>
              </TouchableOpacity>
            </View>
            {otpError ? (
              <Text className="text-red-500 text-xs font-semibold">{otpError}</Text>
            ) : null}
          </Card>
        );

      case BookingStatus.IN_PROGRESS:
        return (
          <Button
            label="Complete Job Shift"
            onPress={handleCompleteJob}
            className="bg-worker-600 active:bg-worker-700 h-14 mb-8"
          />
        );

      default:
        return null;
    }
  };

  const customerName = 'Customer'; // Usually nested or fetched relation
  const customerPhone = '+919999999999';

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-900 bg-slate-950">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
          Job Details
        </Text>
        <Badge
          label={getStatusLabel(job.status)}
          variant={getStatusVariant(job.status)}
        />
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Customer Location on Map */}
        {[
          BookingStatus.WORKER_ACCEPTED,
          BookingStatus.ON_THE_WAY,
          BookingStatus.ARRIVED,
          BookingStatus.IN_PROGRESS,
        ].includes(job.status) ? (
          <View className="mb-6">
            <Text className="text-white text-sm font-bold mb-3">Service Shift Route</Text>
            <MapPlaceholder
              workerLat={currentCoords?.lat}
              workerLng={currentCoords?.lng}
              destLat={job.lat}
              destLng={job.lng}
              workerName="You (Worker)"
              statusText={getStatusLabel(job.status)}
            />
          </View>
        ) : null}

        {/* Customer Detail Card */}
        {[
          BookingStatus.WORKER_ACCEPTED,
          BookingStatus.ON_THE_WAY,
          BookingStatus.ARRIVED,
          BookingStatus.IN_PROGRESS,
        ].includes(job.status) ? (
          <Card className="bg-slate-900 border-slate-800 p-5 mb-6">
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">
              Customer Info
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-12 h-12 rounded-full bg-worker-500/20 border border-worker-500/30 justify-center items-center mr-3">
                  <Ionicons name="person" size={24} color="#a78bfa" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold" numberOfLines={1}>
                    {customerName}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Rating: 4.9★</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleCallCustomer(customerPhone)}
                className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 justify-center items-center active:bg-slate-900"
              >
                <Ionicons name="call" size={20} color="#10b981" />
              </TouchableOpacity>
            </View>
          </Card>
        ) : null}

        {/* Job Info */}
        <Card className="bg-slate-900 border-slate-850 p-5 mb-6">
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-4">
            Service Details
          </Text>

          <View className="flex-row justify-between mb-3.5">
            <Text className="text-slate-400 text-xs">Job Type</Text>
            <Text className="text-white text-xs font-bold">{job.service_items?.name ?? 'Home Cleaning'}</Text>
          </View>

          <View className="flex-row justify-between mb-3.5">
            <Text className="text-slate-400 text-xs">Earnings Share</Text>
            <Text className="text-white text-xs font-extrabold text-worker-400">₹{job.total_amount}</Text>
          </View>

          <View className="flex-row justify-between mb-3.5">
            <Text className="text-slate-400 text-xs">Payment Mode</Text>
            <Text className="text-white text-xs font-bold">{job.payment_mode}</Text>
          </View>

          <View className="h-[1px] bg-slate-800 my-3" />

          <View className="mb-2">
            <Text className="text-slate-400 text-xs mb-1.5">Customer Address</Text>
            <Text className="text-slate-200 text-xs leading-4">{job.address_line}</Text>
          </View>

          {job.notes ? (
            <View className="mt-3">
              <Text className="text-slate-400 text-xs mb-1.5">Special Request</Text>
              <Text className="text-slate-350 text-xs italic leading-4">"{job.notes}"</Text>
            </View>
          ) : null}
        </Card>

        {/* Workflow actions */}
        {renderWorkflowButton()}
      </ScrollView>
    </SafeAreaView>
  );
}
