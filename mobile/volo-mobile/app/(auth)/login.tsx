import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneSchema } from '@volo/shared-types';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'customer' | 'worker'>('customer');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    const validation = PhoneSchema.safeParse(digits);
    if (!validation.success) {
      Alert.alert('Invalid Phone', validation.error.issues[0]?.message || 'Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      // Navigate to OTP screen — Firebase OTP init happens there
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { phone: `+91${digits}`, role },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-16 pb-8">
            {/* Header */}
            <View className="mb-12">
              <View className="w-16 h-16 rounded-2xl bg-brand-500 items-center justify-center mb-6">
                <Text className="text-white text-3xl font-bold">V</Text>
              </View>
              <Text className="text-white text-4xl font-bold mb-2">Welcome to VOLO</Text>
              <Text className="text-surface-muted text-base">
                Home services at your fingertips
              </Text>
            </View>

            {/* Role selector */}
            <View className="mb-6">
              <Text className="text-surface-muted text-sm mb-3 font-medium">I am a</Text>
              <View className="flex-row gap-3">
                {(['customer', 'worker'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRole(r)}
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      role === r
                        ? 'bg-brand-500 border-brand-500'
                        : 'bg-surface-card border-surface-border'
                    }`}
                  >
                    <Text
                      className={`font-semibold capitalize ${
                        role === r ? 'text-white' : 'text-surface-muted'
                      }`}
                    >
                      {r === 'customer' ? '🏠 Customer' : '🔧 Worker'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Phone Input */}
            <View className="mb-6">
              <Text className="text-surface-muted text-sm mb-2 font-medium">Mobile Number</Text>
              <View className="flex-row items-center bg-surface-card border border-surface-border rounded-xl px-4 h-14">
                <Text className="text-surface-muted text-base mr-3">🇮🇳 +91</Text>
                <View className="w-px h-6 bg-surface-border mr-3" />
                <TextInput
                  className="flex-1 text-white text-base"
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#475569"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={loading || phone.replace(/\D/g, '').length !== 10}
              className={`h-14 rounded-xl items-center justify-center ${
                loading || phone.replace(/\D/g, '').length !== 10
                  ? 'bg-brand-800'
                  : 'bg-brand-500'
              }`}
            >
              <Text className="text-white text-base font-semibold">
                {loading ? 'Please wait…' : 'Get OTP →'}
              </Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-center text-surface-muted text-xs mt-8 leading-5">
              By continuing, you agree to our{' '}
              <Text className="text-brand-400">Terms of Service</Text> and{' '}
              <Text className="text-brand-400">Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
