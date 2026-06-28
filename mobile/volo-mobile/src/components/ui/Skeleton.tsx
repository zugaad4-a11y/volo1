import { useEffect, useRef } from 'react';
import { Animated, ViewProps } from 'react-native';

interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className = '', style, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ opacity }, style]}
      className={`bg-slate-800 rounded-lg ${className}`}
      {...props}
    />
  );
}
