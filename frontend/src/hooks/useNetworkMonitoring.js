import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Monitors network connectivity during an exam.
 * Fires onOffline when the student loses internet connection.
 * Fires onOnline when they reconnect.
 */
const useNetworkMonitoring = ({
  enabled = true,
  onOffline = null,
  onOnline = null,
} = {}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const onOfflineRef = useRef(onOffline);
  const onOnlineRef = useRef(onOnline);
  const offlineTimeRef = useRef(null);

  useEffect(() => { onOfflineRef.current = onOffline; }, [onOffline]);
  useEffect(() => { onOnlineRef.current = onOnline; }, [onOnline]);

  useEffect(() => {
    if (!enabled) return;

    const handleOffline = () => {
      setIsOnline(false);
      offlineTimeRef.current = new Date().toISOString();
      toast.error('🌐 Internet disconnected! Reconnect immediately — your progress may be lost.', { autoClose: false, toastId: 'network-offline' });
      if (onOfflineRef.current) onOfflineRef.current({ timestamp: offlineTimeRef.current });
    };

    const handleOnline = () => {
      setIsOnline(true);
      toast.dismiss('network-offline');
      const duration = offlineTimeRef.current
        ? `${Math.round((Date.now() - new Date(offlineTimeRef.current).getTime()) / 1000)}s`
        : 'unknown';
      toast.success(`🌐 Reconnected after ${duration} offline.`);
      if (onOnlineRef.current) onOnlineRef.current({ timestamp: new Date().toISOString(), offlineDuration: duration });
      offlineTimeRef.current = null;
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      toast.dismiss('network-offline');
    };
  }, [enabled]);

  return { isOnline };
};

export default useNetworkMonitoring;
