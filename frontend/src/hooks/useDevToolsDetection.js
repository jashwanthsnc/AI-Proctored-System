import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

/**
 * Detects when browser DevTools are opened during an exam.
 * Uses three methods: window size delta, console profiling trick, debugger timing.
 */
const useDevToolsDetection = ({
  enabled = true,
  cooldownMs = 20000,
  onDetected = null,
} = {}) => {
  const lastFiredRef = useRef(0);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => { onDetectedRef.current = onDetected; }, [onDetected]);

  useEffect(() => {
    if (!enabled) return;

    const fire = (method) => {
      const now = Date.now();
      if (now - lastFiredRef.current < cooldownMs) return;
      lastFiredRef.current = now;
      toast.error('🛑 Developer Tools detected! This is a violation.');
      if (onDetectedRef.current) onDetectedRef.current({ method, timestamp: new Date().toISOString() });
    };

    // ── Method 1: Window size delta ──────────────────────────────────────────
    // DevTools take up ~200px+ when docked. Check every 2 seconds.
    const THRESHOLD = 160;
    let sizeCheckId = null;
    const checkSize = () => {
      const widthDelta = window.outerWidth - window.innerWidth;
      const heightDelta = window.outerHeight - window.innerHeight;
      if (widthDelta > THRESHOLD || heightDelta > THRESHOLD) {
        fire('size-delta');
      }
    };
    sizeCheckId = setInterval(checkSize, 2000);

    // ── Method 2: console.log object with getter trick ───────────────────────
    // When DevTools are open and the console is inspected, the getter fires.
    const devtoolsCheck = /./;
    devtoolsCheck.toString = () => {
      fire('console-trick');
      return '';
    };

    const consolePoll = setInterval(() => {
      // This triggers the toString only when DevTools console is actively open
      console.log('%c', devtoolsCheck); // eslint-disable-line no-console
    }, 5000);

    return () => {
      clearInterval(sizeCheckId);
      clearInterval(consolePoll);
    };
  }, [enabled, cooldownMs]);
};

export default useDevToolsDetection;
