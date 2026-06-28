import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Booking, BookingStatus } from '@volo/shared-types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

interface JobCardProps {
  job: Booking;
  onPress: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  showActions?: boolean;
}

export function JobCard({
  job,
  onPress,
  onAccept,
  onReject,
  showActions = false,
}: JobCardProps) {
  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.COMPLETED:
        return 'success';
      case BookingStatus.CANCELLED:
        return 'error';
      case BookingStatus.WORKER_ASSIGNED:
        return 'warning';
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

  const serviceName = job.service_items?.name ?? 'Cleaning Job';
  const pay = job.total_amount;
  const address = job.address_line;

  const formattedDate = new Date(job.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="mb-4">
      <Card className="border-slate-800 bg-slate-900/60 active:border-slate-700">
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
            label={getStatusLabel(job.status)}
            variant={getStatusVariant(job.status)}
            size="sm"
          />
        </View>

        <View className="flex-row items-center mb-3">
          <Ionicons name="location-outline" size={14} color="#94a3b8" />
          <Text className="text-slate-350 text-xs ml-1 flex-1" numberOfLines={1}>
            {address}
          </Text>
        </View>

        {job.notes ? (
          <View className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 mb-3">
            <Text className="text-slate-400 text-xs italic" numberOfLines={2}>
              "{job.notes}"
            </Text>
          </View>
        ) : null}

        <View className="h-[1px] bg-slate-800/80 my-2" />

        <View className="flex-row justify-between items-center mt-1">
          <View className="flex-row items-center">
            <Ionicons name="cash-outline" size={16} color="#0a58ca" />
            <Text className="text-slate-455 text-xs ml-1.5 font-medium">Earnings</Text>
          </View>
          <Text className="text-white text-base font-extrabold">
            ₹{pay}
          </Text>
        </View>

        {showActions && job.status === BookingStatus.WORKER_ASSIGNED && (
          <View className="flex-row mt-4 space-x-3">
            {onReject && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onReject();
                }}
                className="flex-1 h-11 border border-slate-800 rounded-xl items-center justify-center active:bg-slate-900"
              >
                <Text className="text-slate-400 font-semibold text-sm">Decline</Text>
              </TouchableOpacity>
            )}
            {onAccept && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                className="flex-1 h-11 bg-worker-500 rounded-xl items-center justify-center active:bg-worker-600"
              >
                <Text className="text-white font-semibold text-sm">Accept Job</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}
