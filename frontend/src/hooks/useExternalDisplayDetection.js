import { useEffect, useRef, useState } from 'react';

/**
 * Detects external / multiple displays (HDMI, USB-C, DisplayPort, wireless, Bluetooth).
 *
 * Detection strategies (in order of accuracy):
 *   1. window.getScreenDetails()  — exact screen list + labels (requires window-management permission)
 *   2. window.screen.isExtended   — boolean, no permission needed (Chrome 100+)
 *   3. Resolution heuristic       — ultra-wide aspect ratio fallback
 *
 * Connection-type inference from screen label:
 *   Miracast / WFD / Wireless → "Wireless"
 *   Bluetooth                 → "Bluetooth"
 *   HDMI                      → "HDMI"
 *   DisplayPort / DP          → "DisplayPort"
 *   USB-C / Type-C / USB      → "USB-C"
 *   VGA                       → "VGA"
 *   Everything else           → "External"
 */

const inferConnectionType = (label = '') => {
  const l = label.toLowerCase();
  if (/miracast|wfd|wireless|wifi|wi-fi/.test(l))  return 'Wireless';
  if (/bluetooth|bt /.test(l))                     return 'Bluetooth';
  if (/hdmi/.test(l))                              return 'HDMI';
  if (/displayport|dp-/.test(l))                   return 'DisplayPort';
  if (/usb-c|type-c|usbc|usb /.test(l))           return 'USB-C';
  if (/thunderbolt|tb3|tb4/.test(l))               return 'Thunderbolt';
  if (/vga/.test(l))                               return 'VGA';
  if (/tv|television|chromecast|airplay/.test(l))  return 'Smart TV / Cast';
  return 'External';
};

const useExternalDisplayDetection = ({
  enabled          = true,
  onViolation      = null,
  detectionInterval = 5000,
} = {}) => {
  const [screenCount,               setScreenCount]               = useState(1);
  const [isExternalDisplayDetected, setIsExternalDisplayDetected] = useState(false);
  const [isSupported,               setIsSupported]               = useState(false);
  const [detectedScreens,           setDetectedScreens]           = useState([]);  // [{label,width,height,isPrimary,connectionType}]
  const [detectionMethod,           setDetectionMethod]           = useState('');

  const onViolationRef         = useRef(onViolation);
  const lastViolationTimeRef   = useRef(0);
  const permissionGrantedRef   = useRef(false);
  const screenDetailsRef       = useRef(null);

  // Always keep callback ref current without re-running effects
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    const extendedSupported = typeof window.screen?.isExtended !== 'undefined';
    const detailsSupported  = 'getScreenDetails' in window;
    setIsSupported(extendedSupported || detailsSupported);

    let intervalId           = null;
    let screensChangeSub     = null;
    let gestureAdded         = false;

    // ── Rate-limited violation reporter ──────────────────────────────────────
    const reportViolation = (count, screens, method) => {
      const now = Date.now();
      if (now - lastViolationTimeRef.current < detectionInterval) return;
      lastViolationTimeRef.current = now;
      if (onViolationRef.current) {
        onViolationRef.current({
          screenCount  : count,
          screens,
          method,
          timestamp    : new Date().toISOString(),
        });
      }
    };

    // ── Core detection ────────────────────────────────────────────────────────
    const performCheck = async () => {
      let detected  = false;
      let count     = 1;
      let method    = '';
      let screens   = [];

      // ① getScreenDetails — most accurate; gives labels → connection type
      if (detailsSupported) {
        try {
          const sd = screenDetailsRef.current || (await window.getScreenDetails());
          if (!screenDetailsRef.current) {
            screenDetailsRef.current   = sd;
            permissionGrantedRef.current = true;
            // Live topology changes
            const onChange = () => performCheck();
            sd.addEventListener('screenschange', onChange);
            screensChangeSub = () => sd.removeEventListener('screenschange', onChange);
          }
          const list = sd.screens || [];
          if (list.length > 1) {
            detected = true;
            count    = list.length;
            method   = 'getScreenDetails';
            screens  = list.map(s => ({
              label          : s.label || (s.isPrimary ? 'Primary Display' : 'External Display'),
              width          : s.width,
              height         : s.height,
              isPrimary      : s.isPrimary,
              isInternal     : s.isInternal ?? s.isPrimary,
              connectionType : inferConnectionType(s.label || ''),
            }));
          }
        } catch { /* permission denied or not available */ }
      }

      // ② screen.isExtended — synchronous, no permission required
      if (!detected && extendedSupported && window.screen.isExtended) {
        detected = true;
        count    = 2;
        method   = 'screen.isExtended';
        screens  = [
          { label: 'Primary Display',  isPrimary: true,  connectionType: 'Primary',  width: window.screen.width, height: window.screen.height },
          { label: 'External Display', isPrimary: false, connectionType: 'External', width: 0, height: 0 },
        ];
      }

      // ③ Resolution heuristic — ultra-wide likely means spanned/extended desktop
      if (!detected && !extendedSupported && !detailsSupported) {
        const ratio = window.screen.width / window.screen.height;
        if (ratio > 2.8) {
          detected = true;
          count    = 2;
          method   = 'resolution-heuristic';
          screens  = [
            { label: `Spanned Desktop (${window.screen.width}×${window.screen.height})`, isPrimary: false, connectionType: 'External', width: window.screen.width, height: window.screen.height },
          ];
        }
      }

      setScreenCount(count);
      setIsExternalDisplayDetected(detected);
      setDetectedScreens(detected ? screens : []);
      setDetectionMethod(detected ? method : '');

      if (detected) reportViolation(count, screens, method);
    };

    // ── Request getScreenDetails on first user interaction ────────────────────
    const onGesture = async () => {
      if (permissionGrantedRef.current || !detailsSupported) return;
      cleanupGesture();
      try {
        const sd = await window.getScreenDetails();
        screenDetailsRef.current    = sd;
        permissionGrantedRef.current = true;
        const onChange = () => performCheck();
        sd.addEventListener('screenschange', onChange);
        screensChangeSub = () => sd.removeEventListener('screenschange', onChange);
        performCheck();
      } catch { /* user denied */ }
    };

    const cleanupGesture = () => {
      document.removeEventListener('click',   onGesture);
      document.removeEventListener('keydown', onGesture);
      gestureAdded = false;
    };

    if (detailsSupported && !permissionGrantedRef.current) {
      document.addEventListener('click',   onGesture);
      document.addEventListener('keydown', onGesture);
      gestureAdded = true;
    }

    // ── Start polling ─────────────────────────────────────────────────────────
    performCheck();
    intervalId = setInterval(performCheck, detectionInterval);

    return () => {
      clearInterval(intervalId);
      if (gestureAdded) cleanupGesture();
      if (screensChangeSub) screensChangeSub();
    };
  }, [enabled, detectionInterval]);

  return {
    screenCount,
    isExternalDisplayDetected,
    isSupported,
    detectedScreens,
    detectionMethod,
    hasPermission: permissionGrantedRef.current,
  };
};

export default useExternalDisplayDetection;
