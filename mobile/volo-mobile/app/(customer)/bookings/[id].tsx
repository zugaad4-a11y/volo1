import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getBookingById, cancelBooking } from '@/api/bookings';
import { MapPlaceholder } from '@/components/MapPlaceholder';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePolling } from '@/hooks/usePolling';
import { BookingStatus } from '@volo/shared-types';

export default function BookingDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Booking Query
  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['booking-detail', id],
    queryFn: () => getBookingById(id),
  });

  const booking = data?.booking;

  // Poll booking status and worker location every 10s if worker is assigned/accepted/on_the_way/arrived/in_progress
  const isPolled =
    booking &&
    [
      BookingStatus.PENDING_ASSIGNMENT,
      BookingStatus.WORKER_ASSIGNED,
      BookingStatus.WORKER_ACCEPTED,
      BookingStatus.ON_THE_WAY,
      BookingStatus.ARRIVED,
      BookingStatus.IN_PROGRESS,
    ].includes(booking.status);

  usePolling(
    async () => {
      await refetch();
    },
    isPolled ? 10000 : null,
    !!isPolled
  );

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: (res) => {
      if (res.success) {
        Alert.alert('Booking Cancelled', 'Your booking request has been cancelled.');
        queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
        queryClient.invalidateQueries({ queryKey: ['active-bookings'] });
      }
    },
    onError: (err: any) => {
      Alert.alert('Cancellation Failed', err?.response?.data?.error ?? 'Unable to cancel this booking.');
    },
  });

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking request?', [
      { text: 'No, keep it', style: 'cancel' },
      { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
    ]);
  };

  const handleCallWorker = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', 'Unable to initiate call on this device.');
    });
  };

  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED:
        return 'success';
      case BookingStatus.CANCELLED:
        return 'error';
      case BookingStatus.PENDING_ASSIGNMENT:
      case BookingStatus.MANUAL_ASSIGNMENT_REQUIRED:
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
        <ActivityIndicator size="large" color="#FF7A00" />
        <Text className="text-slate-400 text-xs mt-2">Loading booking details…</Text>
      </View>
    );
  }

  if (isError || !booking) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-950 px-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-white text-lg font-bold mt-4">Booking not found</Text>
        <Text className="text-slate-400 text-xs text-center mt-2 mb-6">
          The booking ID might be invalid, or it belongs to another user.
        </Text>
        <Button label="Back to Bookings" onPress={() => router.back()} />
      </View>
    );
  }

  // Check if cancellation is allowed
  const isCancellable = [
    BookingStatus.PENDING_ASSIGNMENT,
    BookingStatus.WORKER_ASSIGNED,
    BookingStatus.WORKER_ACCEPTED,
    BookingStatus.MANUAL_ASSIGNMENT_REQUIRED,
  ].includes(booking.status);

  // Extract worker fields safely (backend nested query)
  const workerFullName = booking.workers?.users?.full_name;
  const workerPhone = booking.workers?.users?.phone;

  // Retrieve locations safely from database (simulated through standard coordinates if null)
  // Let's check if the worker location exists.
  // The backend might return coordinates inside 'workers' object or we fall back.
  const workerLat = (booking as any).workers?.current_lat ?? null;
  const workerLng = (booking as any).workers?.current_lng ?? null;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-900 bg-slate-950">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1" numberOfLines={1}>
          Booking Details
        </Text>
        <Badge
          label={getStatusLabel(booking.status)}
          variant={getStatusVariant(booking.status)}
        />
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {/* Tracking Map View if active */}
        {isPolled && booking.status !== BookingStatus.PENDING_ASSIGNMENT ? (
          <View className="mb-6">
            <Text className="text-white text-sm font-bold mb-3">Live Service Map</Text>
            <MapPlaceholder
              workerLat={workerLat}
              workerLng={workerLng}
              destLat={booking.lat}
              destLng={booking.lng}
              workerName={workerFullName ?? 'Service Partner'}
              statusText={getStatusLabel(booking.status)}
            />
          </View>
        ) : booking.status === BookingStatus.PENDING_ASSIGNMENT ? (
          <Card className="bg-slate-900 border-slate-800 p-6 items-center mb-6">
            <ActivityIndicator size="large" color="#eab308" className="mb-4" />
            <Text className="text-white text-base font-bold text-center mb-1">
              Finding a Service Partner
            </Text>
            <Text className="text-slate-400 text-xs text-center leading-4">
              We are scanning for workers in your area. Hang tight, this usually takes under a minute.
            </Text>
          </Card>
        ) : null}

        {/* Worker Details Card if assigned */}
        {workerFullName ? (
          <Card className="bg-slate-900 border-slate-800 p-5 mb-6">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-3">
              Your Service Partner
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/30 justify-center items-center mr-3">
                  <Ionicons name="person" size={24} color="#818cf8" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold" numberOfLines={1}>
                    {workerFullName}
                  </Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Rating: 4.8★</Text>
                </View>
              </View>
              {workerPhone ? (
                <TouchableOpacity
                  onPress={() => handleCallWorker(workerPhone)}
                  className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 justify-center items-center active:bg-slate-900"
                >
                  <Ionicons name="call" size={20} color="#10b981" />
                </TouchableOpacity>
              ) : null}
            </View>
          </Card>
        ) : null}

        {/* Booking PIN Code Card */}
        {booking.otp && booking.status === BookingStatus.WORKER_ACCEPTED ? (
          <Card className="bg-brand-950/10 border-brand-500/20 p-5 mb-6 items-center">
            <Text className="text-brand-300 text-xs font-bold uppercase tracking-wider mb-1.5">
              Service Verification Code (PIN)
            </Text>
            <Text className="text-white text-3xl font-extrabold tracking-widest">{booking.otp}</Text>
            <Text className="text-slate-400 text-[10px] text-center mt-2">
              Share this code with the partner when they arrive to start the job.
            </Text>
          </Card>
        ) : null}

        {/* Job Details Card */}
        <Card className="bg-slate-900 border-slate-800 p-5 mb-6">
          <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-4">
            Job Details
          </Text>

          <View className="flex-row justify-between mb-3.5">
            <Text className="text-slate-400 text-xs">Service</Text>
            <Text className="text-white text-xs font-bold">{booking.service_items?.name ?? 'Clean'}</Text>
          </View>

          <View className="flex-row justify-between mb-3.5">
            <Text className="text-slate-400 text-xs">Scheduled Time</Text>
            <Text className="text-white text-xs font-bold">
              {new Date(booking.created_at).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3.5">
            <Text className="text-slate-400 text-xs">Payment Method</Text>
            <Text className="text-white text-xs font-bold">{booking.payment_mode}</Text>
          </View>

          <View className="flex-row justify-between mb-3.5">
            <Text className="text-slate-400 text-xs">Service Charge</Text>
            <Text className="text-white text-xs font-extrabold">₹{booking.total_amount}</Text>
          </View>

          <View className="h-[1px] bg-slate-800 my-3" />

          <View className="mb-2">
            <Text className="text-slate-400 text-xs mb-1.5">Address</Text>
            <Text className="text-slate-200 text-xs leading-4">{booking.address_line}</Text>
          </View>

          {booking.notes ? (
            <View className="mt-3">
              <Text className="text-slate-400 text-xs mb-1.5">Special Instructions</Text>
              <Text className="text-slate-350 text-xs italic leading-4">"{booking.notes}"</Text>
            </View>
          ) : null}
        </Card>

        {/* Action Button */}
        {isCancellable ? (
          <Button
            label={cancelMutation.isPending ? 'Cancelling booking…' : 'Cancel Booking Request'}
            variant="danger"
            onPress={handleCancel}
            loading={cancelMutation.isPending}
            className="mb-12 h-14"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
