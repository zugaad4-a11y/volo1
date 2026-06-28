import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getServices, createBooking } from '@/api/bookings';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { CreateBookingSchema } from '@volo/shared-types';

export default function CreateBookingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();

  // State
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD' | 'WALLET'>('COD');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Fetch Services catalog
  const { data, isLoading } = useQuery({
    queryKey: ['customer-services'],
    queryFn: getServices,
  });

  // Get current category
  const categories = data?.categories ?? [];
  const currentCategory = categories.find((c) => c.id === categoryId);
  const services = currentCategory?.items ?? [];

  // Get GPS location on mount
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find workers nearby.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      
      // Reverse geocode to get a readable address shortcut (best-effort)
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const formatted = [
          item.name,
          item.street,
          item.district,
          item.city,
          item.postalCode
        ].filter(Boolean).join(', ');
        setAddress(formatted);
      }
    } catch (err) {
      console.warn('Failed to fetch location automatically:', err);
    } finally {
      setLocating(false);
    }
  };

  // Mutation
  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (res) => {
      if (res.success) {
        Alert.alert('Booking Placed', 'Your booking request is sent successfully.', [
          {
            text: 'View Booking',
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ['active-bookings'] });
              queryClient.invalidateQueries({ queryKey: ['customer-active-bookings'] });
              router.replace(`/(customer)/bookings/${res.bookingId}`);
            },
          },
        ]);
      } else {
        Alert.alert('Booking Error', res.message ?? 'Failed to place booking.');
      }
    },
    onError: (err: any) => {
      Alert.alert('Error', err?.response?.data?.error ?? 'Unable to create booking. Please try again.');
    },
  });

  const handleBook = () => {
    const payload = {
      service_item_id: selectedService,
      address: address.trim(),
      latitude: coords?.lat,
      longitude: coords?.lng,
      payment_mode: paymentMode,
      notes: notes.trim() || undefined,
    };

    const validation = CreateBookingSchema.safeParse(payload);
    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || 'Validation error';
      Alert.alert('Validation Error', errorMsg);
      return;
    }

    bookingMutation.mutate(validation.data);
  };

  const selectedItemData = services.find((s) => s.id === selectedService);

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-900 bg-slate-950">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          Book {currentCategory?.name || 'Service'}
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF7A00" />
          <Text className="text-slate-400 text-xs mt-2">Loading catalog…</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          {/* Service items list */}
          <Text className="text-white text-sm font-bold mb-3">Select Service Type</Text>
          {services.map((item) => {
            const isSelected = selectedService === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setSelectedService(item.id)}
                activeOpacity={0.8}
                className="mb-3"
              >
                <Card
                  variant={isSelected ? 'brand' : 'default'}
                  className={`border-slate-800 ${isSelected ? 'border-brand-500/50 bg-brand-950/10' : ''}`}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-4">
                      <Text className="text-white text-sm font-bold mb-1">{item.name}</Text>
                      {item.description ? (
                        <Text className="text-slate-400 text-xs leading-4 mb-2">{item.description}</Text>
                      ) : null}
                      <Text className="text-brand-400 text-xs font-semibold">
                        Est. Duration: {item.estimated_mins} mins
                      </Text>
                    </View>
                    <Text className="text-white text-base font-extrabold">₹{item.base_price}</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}

          {/* Location input */}
          <Text className="text-white text-sm font-bold mt-4 mb-3">Service Address</Text>
          <View className="relative justify-center">
            <Input
              placeholder="Enter your complete address"
              value={address}
              onChangeText={setAddress}
              className="pr-12"
              multiline
              numberOfLines={2}
            />
            <TouchableOpacity
              onPress={getLocation}
              disabled={locating}
              className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 justify-center items-center active:bg-slate-700"
            >
              {locating ? (
                <ActivityIndicator size="small" color="#818cf8" />
              ) : (
                <Ionicons name="location" size={16} color="#818cf8" />
              )}
            </TouchableOpacity>
          </View>
          {coords ? (
            <Text className="text-slate-500 text-[10px] -mt-2 font-mono">
              Coordinates locked: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </Text>
          ) : (
            <Text className="text-amber-500 text-[10px] -mt-2 font-medium">
              Acquiring accurate GPS coordinates...
            </Text>
          )}

          {/* Notes */}
          <Text className="text-white text-sm font-bold mt-4 mb-3">Notes for Worker (Optional)</Text>
          <Input
            placeholder="e.g. Please bring extra laundry bags, gate passcode is #123"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ height: 80, textAlignVertical: 'top' }}
          />

          {/* Payment Method */}
          <Text className="text-white text-sm font-bold mt-4 mb-3">Payment Method</Text>
          <View className="flex-row space-x-3 mb-8">
            <TouchableOpacity
              onPress={() => setPaymentMode('COD')}
              className={`flex-1 py-3 px-4 rounded-xl border items-center flex-row justify-center space-x-2 ${
                paymentMode === 'COD'
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              <Ionicons name="cash-outline" size={18} color={paymentMode === 'COD' ? '#818cf8' : '#94a3b8'} />
              <Text className={`text-xs font-bold ${paymentMode === 'COD' ? 'text-white font-extrabold' : 'text-slate-400'}`}>
                Cash (COD)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMode('ONLINE')}
              className={`flex-1 py-3 px-4 rounded-xl border items-center flex-row justify-center space-x-2 ${
                paymentMode === 'ONLINE'
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              <Ionicons name="card-outline" size={18} color={paymentMode === 'ONLINE' ? '#818cf8' : '#94a3b8'} />
              <Text className={`text-xs font-bold ${paymentMode === 'ONLINE' ? 'text-white font-extrabold' : 'text-slate-400'}`}>
                Online
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMode('WALLET')}
              className={`flex-1 py-3 px-4 rounded-xl border items-center flex-row justify-center space-x-2 ${
                paymentMode === 'WALLET'
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-slate-800 bg-slate-900'
              }`}
            >
              <Ionicons name="wallet-outline" size={18} color={paymentMode === 'WALLET' ? '#818cf8' : '#94a3b8'} />
              <Text className={`text-xs font-bold ${paymentMode === 'WALLET' ? 'text-white font-extrabold' : 'text-slate-400'}`}>
                Wallet
              </Text>
            </TouchableOpacity>
          </View>

          {/* Book Summary Card */}
          {selectedItemData ? (
            <Card className="bg-slate-900 border-slate-850 p-4 mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-xs">Total Amount</Text>
                <Text className="text-white text-base font-extrabold">₹{selectedItemData.base_price}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-400 text-xs">Payment Transport</Text>
                <Text className="text-white text-xs font-semibold">{paymentMode}</Text>
              </View>
            </Card>
          ) : null}

          {/* Submit button */}
          <Button
            label={bookingMutation.isPending ? 'Sending request…' : 'Confirm Booking Request →'}
            onPress={handleBook}
            loading={bookingMutation.isPending}
            className="mb-12 h-14"
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
