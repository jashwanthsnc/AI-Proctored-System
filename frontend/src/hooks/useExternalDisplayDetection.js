import { useEffect, useRef, useState } from 'react';


/**
 * Custom hook to detect external/multiple displays during exams.
 *
 * Detection strategies:
 * 1. screen.isExtended — synchronous, no permission needed (Chrome 100+)
 * 2. window.getScreenDetails() — needs user gesture, gives exact screen count
 * 3. Resolution heuristic — detects unusually wide screens (likely spanned/extended)
 */
const useExternalDisplayDetection = ({
  enabled = true,
  onViolation = null,
  detectionInterval = 5000,
} = {}) => {
  const [screenCount, setScreenCount] = useState(1);
  const [isExternalDisplayDetected, setIsExternalDisplayDetected] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Use refs for callbacks and mutable state to avoid re-render dependency issues
  const onViolationRef = useRef(onViolation);
  const screenDetailsRef = useRef(null);
  const lastViolationTimeRef = useRef(0);

  const permissionGrantedRef = useRef(false);

  // Cooldown matches detection interval so violation count increments each poll cycle
  const VIOLATION_COOLDOWN_MS = detectionInterval;

  // Keep callback ref up to date without causing effect re-runs
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    let intervalId = null;
    let gestureCleanup = null;
    let screensChangeCleanup = null;

    // --- Diagnostic logging on mount ---
    const extendedValue = window.screen?.isExtended;
    const extendedSupported = typeof extendedValue !== 'undefined';
    const detailsSupported = 'getScreenDetails' in window;

    console.log('🖥️ [DisplayDetection] Initializing...', {
      'screen.isExtended supported': extendedSupported,
      'screen.isExtended value': extendedValue,
      'getScreenDetails supported': detailsSupported,
      'screen.width': window.screen?.width,
      'screen.height': window.screen?.height,
      'screen.availWidth': window.screen?.availWidth,
      'window.devicePixelRatio': window.devicePixelRatio,
    });

    const supported = extendedSupported || detailsSupported;
    setIsSupported(supported);

    if (!supported) {
      console.warn('🖥️ [DisplayDetection] No detection API available in this browser');
    }

    // --- Report a violation (rate-limited) ---
    const reportViolation = (count, method) => {
      const now = Date.now();
      if (now - lastViolationTimeRef.current < VIOLATION_COOLDOWN_MS) return;
      lastViolationTimeRef.current = now;

      console.warn(`🖥️ [DisplayDetection] VIOLATION — ${count} screen(s) via ${method}`);

      if (onViolationRef.current) {
        onViolationRef.current({
          screenCount: count,
          method,
          timestamp: new Date().toISOString(),
        });
      }

      // Toast notification is handled by the onViolation callback in TestPage
    };

    // --- Core check function ---
    const performCheck = async () => {
      let detected = false;
      let count = 1;
      let method = '';

      // Strategy 1: screen.isExtended
      if (extendedSupported) {
        const extended = window.screen.isExtended;
        if (extended) {
          detected = true;
          count = 2;
          method = 'screen.isExtended';
        }
      }

      // Strategy 2: Call getScreenDetails() fresh each poll for accurate data
      if (permissionGrantedRef.current && detailsSupported) {
        try {
          const details = await window.getScreenDetails();
          screenDetailsRef.current = details;
          const screenList = details.screens;
          if (screenList && screenList.length > 1) {
            detected = true;
            count = screenList.length;
            method = 'getScreenDetails';
          }
        } catch (err) {
          console.log('🖥️ [DisplayDetection] getScreenDetails poll error:', err.message);
        }
      }

      // Strategy 3: Resolution heuristic
      // If screen width is more than 2x the height, likely extended/spanned display
      if (!detected && !extendedSupported) {
        const ratio = window.screen.width / window.screen.height;
        if (ratio > 2.8) {
          detected = true;
          count = 2;
          method = 'resolution-heuristic';
          console.log(`🖥️ [DisplayDetection] Heuristic triggered — screen ratio: ${ratio.toFixed(2)}`);
        }
      }

      setScreenCount(count);
      setIsExternalDisplayDetected(detected);

      if (detected) {
        reportViolation(count, method);
      }
    };

    // --- Request getScreenDetails on first user gesture ---
    const requestPermissionOnGesture = async () => {
      if (permissionGrantedRef.current || !detailsSupported) return;

      console.log('🖥️ [DisplayDetection] Requesting getScreenDetails permission...');
      try {
        const details = await window.getScreenDetails();
        screenDetailsRef.current = details;
        permissionGrantedRef.current = true;

        console.log('🖥️ [DisplayDetection] Permission granted!', {
          screenCount: details.screens.length,
          screens: details.screens.map((s) => ({
            label: s.label,
            width: s.width,
            height: s.height,
            isPrimary: s.isPrimary,
          })),
        });

        // Listen for screen changes
        const onChange = () => {
          console.log('🖥️ [DisplayDetection] screenschange event fired');
          performCheck();
        };
        details.addEventListener('screenschange', onChange);
        screensChangeCleanup = () => details.removeEventListener('screenschange', onChange);

        // Immediately re-check
        performCheck();
      } catch (err) {
        console.log('🖥️ [DisplayDetection] getScreenDetails permission denied:', err.message);
      }
    };

    // Attach gesture listeners
    const onGesture = () => {
      requestPermissionOnGesture();
      // Remove both listeners after first gesture
      document.removeEventListener('click', onGesture);
      document.removeEventListener('keydown', onGesture);
    };

    if (detailsSupported && !permissionGrantedRef.current) {
      document.addEventListener('click', onGesture);
      document.addEventListener('keydown', onGesture);
      gestureCleanup = () => {
        document.removeEventListener('click', onGesture);
        document.removeEventListener('keydown', onGesture);
      };
    }

    // --- Start polling ---
    performCheck(); // Initial check
    intervalId = setInterval(performCheck, detectionInterval);

    console.log(`🖥️ [DisplayDetection] Polling started (every ${detectionInterval}ms)`);

    // --- Cleanup ---
    return () => {
      if (intervalId) clearInterval(intervalId);
      if (gestureCleanup) gestureCleanup();
      if (screensChangeCleanup) screensChangeCleanup();
      console.log('🖥️ [DisplayDetection] Cleaned up');
    };
  }, [enabled, detectionInterval]); // Stable deps only — no callback deps

  return {
    screenCount,
    isExternalDisplayDetected,
    isSupported,
  };
};

export default useExternalDisplayDetection;
