import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Notification, NotificationType } from '@volo/shared-types';
import { Card } from './ui/Card';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const getIconName = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BOOKING_REQUEST:
      case NotificationType.MANUAL_ASSIGNMENT_CREATED:
        return 'briefcase-outline';
      case NotificationType.BOOKING_ACCEPTED:
      case NotificationType.MANUAL_ASSIGNMENT_ACCEPTED:
        return 'checkmark-circle-outline';
      case NotificationType.BOOKING_REJECTED:
      case NotificationType.MANUAL_ASSIGNMENT_REJECTED:
      case NotificationType.MANUAL_ASSIGNMENT_EXPIRED:
        return 'close-circle-outline';
      case NotificationType.WORKER_ARRIVING:
      case NotificationType.WORKER_ARRIVED:
      case NotificationType.WORKER_NEARBY:
        return 'car-outline';
      case NotificationType.JOB_STARTED:
      case NotificationType.ROUTE_STARTED:
        return 'play-outline';
      case NotificationType.JOB_COMPLETED:
        return 'ribbon-outline';
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYOUT_PROCESSED:
        return 'cash-outline';
      case NotificationType.KYC_APPROVED:
        return 'shield-checkmark-outline';
      case NotificationType.KYC_REJECTED:
        return 'shield-outline';
      case NotificationType.LOW_WALLET_BALANCE:
        return 'wallet-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BOOKING_ACCEPTED:
      case NotificationType.KYC_APPROVED:
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYOUT_PROCESSED:
        return '#10b981'; // emerald-500
      case NotificationType.BOOKING_REJECTED:
      case NotificationType.KYC_REJECTED:
      case NotificationType.LOW_WALLET_BALANCE:
        return '#ef4444'; // red-500
      case NotificationType.BOOKING_REQUEST:
      case NotificationType.WORKER_ARRIVING:
      case NotificationType.WORKER_ARRIVED:
      case NotificationType.JOB_STARTED:
      case NotificationType.JOB_COMPLETED:
        return '#FF7A00'; // brand orange
      default:
        return '#94a3b8'; // slate-400
    }
  };

  const timeLabel = new Date(notification.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.8}
      className="mb-3"
    >
      <Card
        className={`border-slate-850 p-4 ${
          notification.is_read ? 'opacity-70 bg-slate-900/40' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <View className="flex-row items-start">
          <View
            className="w-10 h-10 rounded-xl items-center justify-center mr-3.5 border"
            style={{
              backgroundColor: `${getIconColor(notification.type)}10`,
              borderColor: `${getIconColor(notification.type)}20`,
            }}
          >
            <Ionicons
              name={getIconName(notification.type) as any}
              size={20}
              color={getIconColor(notification.type)}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-white text-sm font-bold flex-1 mr-2" numberOfLines={1}>
                {notification.title}
              </Text>
              {!notification.is_read && (
                <View className="w-2 h-2 rounded-full bg-brand-500" />
              )}
            </View>
            <Text className="text-slate-350 text-xs leading-4 mb-2">
              {notification.body}
            </Text>
            <Text className="text-slate-500 text-[10px] font-medium">{timeLabel}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
