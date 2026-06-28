import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '@volo/shared-types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface BookingCardProps {
  booking: Booking;
  onPress: () => void;
}

export function BookingCard({ booking, onPress }: BookingCardProps) {
  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED:
        return 'success';
      case BookingStatus.CANCELLED:
        return 'error';
      case BookingStatus.PENDING_ASSIGNMENT:
      case BookingStatus.MANUAL_ASSIGNMENT_REQUIRED:
        return 'warning';
      case BookingStatus.WORKER_ASSIGNED:
      case BookingStatus.WORKER_ACCEPTED:
      case BookingStatus.ON_THE_WAY:
      case BookingStatus.ARRIVED:
      case BookingStatus.IN_PROGRESS:
        return 'brand';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    return status.replace(/_/g, ' ').toLowerCase();
  };

  const serviceName = booking.service_items?.name ?? 'Home Cleaning';
  const price = booking.total_amount;
  const address = booking.address_line;

  // Format date helper
  const formattedDate = new Date(booking.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="mb-4">
      <Card className="border-slate-800 active:border-slate-700 bg-slate-900/60">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-white text-base font-bold mb-1" numberOfLines={1}>
              {serviceName}
            </Text>
            <Text className="text-slate-400 text-xs flex-row items-center">
              <Ionicons name="time-outline" size={12} color="#64748b" /> {formattedDate}
            </Text>
          </View>
          <Badge
            label={getStatusLabel(booking.status)}
            variant={getStatusVariant(booking.status)}
            size="sm"
          />
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="location-outline" size={14} color="#94a3b8" />
          <Text className="text-slate-350 text-xs ml-1 flex-1" numberOfLines={1}>
            {address}
          </Text>
        </View>

        <View className="h-[1px] bg-slate-800/80 my-2" />

        <View className="flex-row justify-between items-center mt-1">
          <View className="flex-row items-center">
            {booking.workers?.users?.full_name ? (
              <>
                <View className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 items-center justify-center mr-2">
                  <Ionicons name="person" size={10} color="#818cf8" />
                </View>
                <Text className="text-slate-300 text-xs font-semibold">
                  {booking.workers.users.full_name}
                </Text>
              </>
            ) : (
              <Text className="text-slate-400 text-xs italic">Finding worker...</Text>
            )}
          </View>
          <Text className="text-white text-base font-extrabold">
            ₹{price}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
