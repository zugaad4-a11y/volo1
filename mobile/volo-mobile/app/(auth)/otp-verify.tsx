import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { verifyFirebaseToken } from '@/api/auth';
import { useAuthStore } from '@/features/auth/authStore';
import { registerDeviceToken } from '@/api/deviceTokens';
import { OtpSchema } from '@volo/shared-types';

export default function OtpVerifyScreen() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams<{ phone: string; role: 'customer' | 'worker' }>();
  const { setAuth } = useAuthStore();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<TextInput[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Send OTP via Firebase on mount
  useEffect(() => {
    sendOtp();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setSending(true);
    try {
      const result = await auth().signInWithPhoneNumber(phone);
      setConfirmation(result);
      startResendTimer();
    } catch (err: any) {
      Alert.alert('OTP Error', err.message ?? 'Failed to send OTP. Check phone number.');
      router.back();
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) inputRefs.current[idx - 1]?.focus();
    // Auto-submit when all 6 digits entered
    if (val && idx === 5 && next.every(Boolean)) {
      verifyOtp(next.join(''));
    }
  };

  const verifyOtp = async (code?: string) => {
    const otpCode = code ?? otp.join('');
    const validation = OtpSchema.safeParse(otpCode);
    if (!validation.success) {
      Alert.alert('Invalid OTP', validation.error.issues[0]?.message || 'Enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      // 1. Confirm OTP with Firebase
      const credential = await confirmation.confirm(otpCode);
      const idToken = await credential.user.getIdToken();

      // 2. Exchange Firebase token for VOLO JWT
      const data = await verifyFirebaseToken(idToken, role);

      // 3. Persist auth state
      await setAuth(data.token, data.refreshToken, data.user);

      // 4. Register FCM token (best-effort)
      try {
        const fcmToken = await messaging().getToken();
        if (fcmToken) {
          await registerDeviceToken(fcmToken, Platform.OS as 'android' | 'ios');
        }
      } catch (err) {
        console.warn('[FCM] Failed to get/register token during login:', err);
      }

      // 5. Route by role
      if (data.user.role === 'worker') {
        router.replace('/(worker)/home');
      } else {
        router.replace('/(customer)/home');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err.message ?? 'Verification failed.';
      Alert.alert('Error', msg);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 px-6 pt-12 pb-8">
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} className="mb-8">
            <Text className="text-brand-400 text-base">← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <Text className="text-white text-3xl font-bold mb-2">Verify OTP</Text>
          <Text className="text-surface-muted text-base mb-10">
            We sent a 6-digit code to{' '}
            <Text className="text-white font-semibold">{phone}</Text>
          </Text>

          {sending ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#FF7A00" size="large" />
              <Text className="text-surface-muted mt-4">Sending OTP…</Text>
            </View>
          ) : (
            <>
              {/* OTP Boxes */}
              <View className="flex-row justify-between mb-10">
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => { if (r) inputRefs.current[idx] = r; }}
                    className={`w-12 h-14 rounded-xl border text-center text-white text-xl font-bold bg-surface-card ${
                      digit ? 'border-brand-500' : 'border-surface-border'
                    }`}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, idx)}
                    autoFocus={idx === 0}
                  />
                ))}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={() => verifyOtp()}
                disabled={loading || otp.some((d) => !d)}
                className={`h-14 rounded-xl items-center justify-center mb-6 ${
                  loading || otp.some((d) => !d) ? 'bg-brand-800' : 'bg-brand-500'
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-semibold">Verify & Continue →</Text>
                )}
              </TouchableOpacity>

              {/* Resend */}
              <View className="items-center">
                {resendTimer > 0 ? (
                  <Text className="text-surface-muted text-sm">
                    Resend OTP in <Text className="text-brand-400">{resendTimer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={sendOtp}>
                    <Text className="text-brand-400 text-sm font-semibold">Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
