import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  size?: 'sm' | 'md';
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
}: BadgeProps) {
  let containerStyle = 'bg-slate-800 border-slate-700';
  let textStyle = 'text-slate-300';

  if (variant === 'success') {
    containerStyle = 'bg-emerald-500/10 border-emerald-500/20';
    textStyle = 'text-emerald-400';
  } else if (variant === 'warning') {
    containerStyle = 'bg-amber-500/10 border-amber-500/20';
    textStyle = 'text-amber-400';
  } else if (variant === 'error') {
    containerStyle = 'bg-rose-500/10 border-rose-500/20';
    textStyle = 'text-rose-400';
  } else if (variant === 'info') {
    containerStyle = 'bg-sky-500/10 border-sky-500/20';
    textStyle = 'text-sky-400';
  } else if (variant === 'brand') {
    containerStyle = 'bg-brand-500/10 border-brand-500/20';
    textStyle = 'text-brand-400';
  }

  const paddingStyle = size === 'sm' ? 'px-2 py-0.5 rounded-md' : 'px-3 py-1 rounded-full';
  const fontSizeStyle = size === 'sm' ? 'text-[10px] font-bold tracking-wide uppercase' : 'text-xs font-semibold';

  return (
    <View className={`border inline-flex items-center justify-center self-start ${paddingStyle} ${containerStyle}`}>
      <Text className={`${textStyle} ${fontSizeStyle}`}>{label}</Text>
    </View>
  );
}
