import { useCallback, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook to check if device is online
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  const checkConnectivity = useCallback(async () => {
    const state = await NetInfo.fetch();
    setIsOnline(!!state.isConnected);
    return state.isConnected;
  }, []);

  return { checkConnectivity, isOnline };
};

/**
 * Hook for debouncing values
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useCallback(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for managing local modal state
 */
export const useModal = (initialState = false) => {
  const [visible, setVisible] = useState(initialState);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);
  const toggle = useCallback(() => setVisible((v) => !v), []);

  return { close, open, toggle, visible };
};
