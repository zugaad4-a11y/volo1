import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getWorkerProfile, updateWorkerProfile } from '@/api/profile';
import { useAuth } from '@/hooks/useAuth';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ProfileUpdateSchema } from '@volo/shared-types';

export default function WorkerProfileScreen() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Fetch Profile Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['worker-profile'],
    queryFn: getWorkerProfile,
  });

  useRefreshOnFocus(refetch);

  const userProfile = data?.user;
  const workerInfo = userProfile?.worker; // Nested worker metadata

  const startEditing = () => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setEmail(userProfile.email || '');
      setIsEditing(true);
    }
  };

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: updateWorkerProfile,
    onSuccess: (res) => {
      if (res.success) {
        Alert.alert('Success', 'Profile updated successfully.');
        queryClient.invalidateQueries({ queryKey: ['worker-profile'] });
        setIsEditing(false);
      }
    },
    onError: (err: any) => {
      Alert.alert('Update Failed', err?.response?.data?.error ?? 'Unable to update profile.');
    },
  });

  const handleSave = () => {
    const payload = {
      full_name: fullName.trim(),
      email: email.trim() || undefined,
    };

    const validation = ProfileUpdateSchema.safeParse(payload);
    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || 'Validation error';
      Alert.alert('Validation Error', errorMsg);
      return;
    }

    updateMutation.mutate(validation.data);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-900 bg-slate-950">
        <Text className="text-white text-xl font-bold">Profile Details</Text>
        {!isEditing && userProfile ? (
          <TouchableOpacity
            onPress={startEditing}
            className="flex-row items-center space-x-1 active:opacity-60"
          >
            <Ionicons name="create-outline" size={16} color="#c084fc" />
            <Text className="text-worker-400 text-sm font-bold">Edit</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0a58ca" />
          <Text className="text-slate-400 text-xs mt-2">Loading profile…</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Profile Card Summary */}
          <Card className="bg-slate-900 border-slate-850 p-6 items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-worker-500/20 items-center justify-center border-2 border-worker-500/30 mb-4 shadow-xl">
              <Ionicons name="person" size={40} color="#a78bfa" />
            </View>
            <Text className="text-white text-lg font-bold">
              {userProfile?.full_name || 'Service Partner'}
            </Text>
            <Text className="text-slate-450 text-xs mt-1">{userProfile?.phone}</Text>
          </Card>

          {isEditing ? (
            <View className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
              />
              <Input
                label="Email Address"
                placeholder="Enter your email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  className="flex-1 h-13 border border-slate-800 rounded-xl items-center justify-center active:bg-slate-900"
                >
                  <Text className="text-slate-400 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 h-13 bg-worker-600 rounded-xl items-center justify-center active:bg-worker-755"
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-semibold">Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="space-y-4 mb-8">
              {/* Account Details Card */}
              <Card className="bg-slate-900/60 border-slate-850 p-4 mb-4">
                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                  Account Details
                </Text>

                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-slate-400 text-xs">Rating</Text>
                  <Text className="text-white text-xs font-semibold">4.8 ★</Text>
                </View>

                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-slate-400 text-xs">KYC Status</Text>
                  <Text className="text-emerald-400 text-xs font-semibold">APPROVED</Text>
                </View>

                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-slate-400 text-xs">Email</Text>
                  <Text className="text-white text-xs font-semibold">
                    {userProfile?.email || 'Not provided'}
                  </Text>
                </View>

                <View className="flex-row justify-between mb-1">
                  <Text className="text-slate-400 text-xs">Phone Number</Text>
                  <Text className="text-slate-200 text-xs font-semibold">{userProfile?.phone}</Text>
                </View>
              </Card>

              {/* Bank account details card */}
              <Card className="bg-slate-900/60 border-slate-850 p-4 mb-4">
                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">
                  Bank Details
                </Text>

                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-slate-400 text-xs">Beneficiary</Text>
                  <Text className="text-white text-xs font-semibold">
                    {workerInfo?.bank_account_name || 'Standard Account'}
                  </Text>
                </View>

                <View className="flex-row justify-between mb-3.5">
                  <Text className="text-slate-400 text-xs">Account Last Four</Text>
                  <Text className="text-white text-xs font-mono font-semibold">
                    •••• {workerInfo?.bank_account_number?.slice(-4) || '1234'}
                  </Text>
                </View>

                <View className="flex-row justify-between mb-1">
                  <Text className="text-slate-400 text-xs">IFSC Code</Text>
                  <Text className="text-white text-xs font-mono font-semibold">
                    {workerInfo?.bank_ifsc || 'HDFC0000123'}
                  </Text>
                </View>
              </Card>

              {/* Logout Button */}
              <Button
                label="Logout Account"
                variant="outline"
                onPress={logout}
                className="border-red-950/40 text-red-500 mt-2 h-13"
              />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
