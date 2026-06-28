import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  className?: string;
  variant?: 'default' | 'muted' | 'brand';
}

export function Card({
  children,
  className = '',
  variant = 'default',
  ...props
}: CardProps) {
  let bgStyle = 'bg-slate-900 border-slate-800/80';
  if (variant === 'muted') {
    bgStyle = 'bg-slate-950/60 border-slate-900';
  } else if (variant === 'brand') {
    bgStyle = 'bg-brand-950/20 border-brand-900/40';
  }

  return (
    <View
      className={`rounded-2xl border p-5 ${bgStyle} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
