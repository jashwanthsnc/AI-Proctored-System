/**
 * useDesktopSecurity
 *
 * Bridges the Electron desktop lockdown app (window.electronSecurity)
 * into the React exam flow.
 *
 * In normal browser mode this hook is a no-op — it checks for
 * window.electronSecurity.isDesktopApp before doing anything so the
 * web app works unchanged when not running inside Electron.
 *
 * When running in the desktop app:
 *   - Signals exam start / end to the Electron main process
 *   - Receives OS-level violations (process scan, network scan, keyboard block)
 *   - Calls the provided onViolation / onBlock callbacks
 *   - Returns { isDesktopApp, desktopViolationCount }
 */

import { useEffect, useRef, useState } from 'react';

const useDesktopSecurity = ({ examId, onViolation, onBlock } = {}) => {
  const isDesktopApp = !!(window.electronSecurity?.isDesktopApp);
  const [desktopViolationCount, setDesktopViolationCount] = useState(0);

  // Keep stable refs to callbacks so the effect doesn't re-register listeners
  const onViolationRef = useRef(onViolation);
  const onBlockRef     = useRef(onBlock);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onBlockRef.current     = onBlock;     }, [onBlock]);

  useEffect(() => {
    if (!isDesktopApp || !examId) return;

    // ── Signal exam start to the Electron main process ────────────────────
    try { window.electronSecurity.examStarted(examId); } catch {}

    // ── Listen for OS-level security violations ───────────────────────────
    try {
      window.electronSecurity.onViolation((violation) => {
        setDesktopViolationCount(n => n + 1);
        if (onViolationRef.current) {
          onViolationRef.current({
            ...violation,
            source: 'desktop',
            // Map to a human-readable label for the toast/log
            label: buildLabel(violation),
          });
        }
      });
    } catch {}

    // ── Listen for critical block events (auto-submit) ────────────────────
    try {
      window.electronSecurity.onBlock((blockData) => {
        if (onBlockRef.current) onBlockRef.current(blockData);
      });
    } catch {}

    // ── Signal exam end on unmount ─────────────────────────────────────────
    return () => {
      try { window.electronSecurity.examFinished(examId); } catch {}
    };
  }, [isDesktopApp, examId]);

  return { isDesktopApp, desktopViolationCount };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildLabel = (v) => {
  switch (v.type) {
    case 'process':
      return `Blocked app detected: ${v.app || v.detail}`;
    case 'network':
      return `Suspicious connection: ${v.service || v.detail} (port ${v.port})`;
    case 'keyboard':
      return `Shortcut blocked: ${v.detail}`;
    case 'display':
      return `Extra display detected: ${v.detail}`;
    default:
      return v.detail || 'Desktop security event';
  }
};

export default useDesktopSecurity;
