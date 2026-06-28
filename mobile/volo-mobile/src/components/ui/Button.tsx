import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  label,
  variant = 'primary',
  loading = false,
  size = 'md',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle = 'rounded-xl items-center justify-center flex-row';
  
  let variantStyle = 'bg-brand-500';
  let textStyle = 'text-white font-semibold';
  
  if (variant === 'primary') {
    variantStyle = disabled || loading ? 'bg-brand-800 opacity-60' : 'bg-brand-500 active:bg-brand-600';
    textStyle = 'text-white font-semibold';
  } else if (variant === 'secondary') {
    variantStyle = disabled || loading ? 'bg-slate-800 opacity-60' : 'bg-slate-800 active:bg-slate-700';
    textStyle = 'text-slate-200 font-semibold';
  } else if (variant === 'outline') {
    variantStyle = disabled || loading ? 'border border-slate-800 opacity-60' : 'border border-slate-700 active:bg-slate-900';
    textStyle = 'text-slate-300 font-semibold';
  } else if (variant === 'danger') {
    variantStyle = disabled || loading ? 'bg-red-950 opacity-60' : 'bg-red-600 active:bg-red-700';
    textStyle = 'text-white font-semibold';
  } else if (variant === 'ghost') {
    variantStyle = disabled || loading ? 'opacity-40' : 'active:bg-slate-900';
    textStyle = 'text-brand-400 font-semibold';
  }

  let sizeStyle = 'py-3.5 px-6';
  let textSize = 'text-base';
  if (size === 'sm') {
    sizeStyle = 'py-2.5 px-4';
    textSize = 'text-sm';
  } else if (size === 'lg') {
    sizeStyle = 'py-4.5 px-8';
    textSize = 'text-lg';
  }

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#FF7A00' : '#fff'} size="small" className="mr-2" />
      ) : null}
      <Text className={`${textStyle} ${textSize}`}>{label}</Text>
    </TouchableOpacity>
  );
}
