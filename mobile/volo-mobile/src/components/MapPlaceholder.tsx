// TODO: replace with react-native-maps once Maps API keys are issued
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './ui/Card';

interface MapPlaceholderProps {
  workerLat?: number | null;
  workerLng?: number | null;
  destLat?: number;
  destLng?: number;
  workerName?: string;
  statusText?: string;
}

export function MapPlaceholder({
  workerLat,
  workerLng,
  destLat,
  destLng,
  workerName = 'Worker',
  statusText = 'En Route',
}: MapPlaceholderProps) {
  // Generate mock coordinates if none exist
  const wLat = workerLat ?? 12.971598;
  const wLng = workerLng ?? 77.594566;
  const dLat = destLat ?? 12.980123;
  const dLng = destLng ?? 77.603456;

  // Calculate simulated distance in km (simple estimation)
  const distance = Math.sqrt(Math.pow(dLat - wLat, 2) + Math.pow(dLng - wLng, 2)) * 111;
  const etaMins = Math.max(1, Math.round(distance * 3)); // ~3 mins per km

  return (
    <View className="w-full h-80 rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 relative justify-center items-center">
      {/* Abstract Map Background grid */}
      <View className="absolute inset-0 opacity-10 flex-col justify-between p-4">
        {[...Array(8)].map((_, i) => (
          <View key={i} className="h-[1px] w-full bg-slate-400" />
        ))}
      </View>
      <View className="absolute inset-0 opacity-10 flex-row justify-between p-4">
        {[...Array(8)].map((_, i) => (
          <View key={i} className="w-[1px] h-full bg-slate-400" />
        ))}
      </View>

      {/* Simulated Route Line */}
      <View className="absolute w-[180px] h-[2px] bg-brand-500/30 rotate-45 flex-row justify-between">
        <View className="w-3 h-3 rounded-full bg-brand-500 -mt-1.5 -ml-1.5 shadow-lg shadow-brand-500 animate-ping" />
        <View className="w-3 h-3 rounded-full bg-emerald-500 -mt-1.5 -mr-1.5 shadow-lg shadow-emerald-500" />
      </View>

      {/* Pulsing radar circle */}
      <View className="absolute border border-brand-500/10 rounded-full w-48 h-48 animate-pulse justify-center items-center">
        <View className="border border-brand-500/20 rounded-full w-32 h-32 justify-center items-center">
          <View className="border border-brand-500/40 rounded-full w-16 h-16" />
        </View>
      </View>

      {/* Worker Marker */}
      <View className="absolute top-24 left-24 items-center">
        <View className="bg-brand-500 p-2 rounded-full border-2 border-white shadow-xl">
          <Ionicons name="car" size={16} color="white" />
        </View>
        <View className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 mt-1">
          <Text className="text-[10px] text-white font-medium">{workerName}</Text>
        </View>
      </View>

      {/* Destination Marker */}
      <View className="absolute bottom-20 right-20 items-center">
        <View className="bg-emerald-500 p-2 rounded-full border-2 border-white shadow-xl">
          <Ionicons name="pin" size={16} color="white" />
        </View>
        <View className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 mt-1">
          <Text className="text-[10px] text-white font-medium">Home</Text>
        </View>
      </View>

      {/* Top HUD Overlay */}
      <View className="absolute top-4 left-4 right-4 flex-row justify-between items-center bg-slate-900/90 px-4 py-3 rounded-2xl border border-slate-850">
        <View>
          <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Status</Text>
          <Text className="text-white text-sm font-semibold">{statusText}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ETA</Text>
          <Text className="text-brand-400 text-sm font-semibold">{etaMins} mins ({distance.toFixed(1)} km)</Text>
        </View>
      </View>

      {/* Bottom Coordinates Overlay */}
      <View className="absolute bottom-4 left-4 right-4 bg-slate-900/95 px-4 py-2.5 rounded-xl border border-slate-800 flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Ionicons name="compass-outline" size={16} color="#0a58ca" />
          <Text className="text-slate-400 text-xs ml-1.5 font-medium">Worker Location:</Text>
        </View>
        <Text className="text-slate-200 text-xs font-mono">
          {wLat.toFixed(5)}, {wLng.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}
