import { View, TextInput, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: string;
}

export function Input({
  label,
  error,
  containerStyle = '',
  className = '',
  ...props
}: InputProps) {
  return (
    <View className={`w-full mb-4 ${containerStyle}`}>
      {label ? (
        <Text className="text-slate-400 text-sm font-medium mb-1.5">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor="#64748b"
        className={`w-full h-13 px-4 rounded-xl border bg-slate-900 text-white text-base border-slate-800 focus:border-brand-500 ${
          error ? 'border-red-500 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      />
      {error ? (
        <Text className="text-red-500 text-xs mt-1 font-medium">{error}</Text>
      ) : null}
    </View>
  );
}
