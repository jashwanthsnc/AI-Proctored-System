import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

const useBrowserLockdown = ({
  enabled = true,
  onViolation = null,
  onTabSwitch = null,
  onWindowBlur = null,
  enforceFullscreen = true,
} = {}) => {
  const isFullscreenRef   = useRef(false);
  const violationCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);

  const onViolationRef  = useRef(onViolation);
  const onTabSwitchRef  = useRef(onTabSwitch);
  const onWindowBlurRef = useRef(onWindowBlur);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onTabSwitchRef.current = onTabSwitch; }, [onTabSwitch]);
  useEffect(() => { onWindowBlurRef.current = onWindowBlur; }, [onWindowBlur]);

  const lastTabSwitchWarningRef   = useRef(0);
  const lastWindowBlurWarningRef  = useRef(0);
  const lastFullscreenWarningRef  = useRef(0);
  const lastMouseLeaveWarningRef  = useRef(0);
  const tabHiddenTimerRef         = useRef(null);

  const checkFullscreen = useCallback(() => !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  ), []);

  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      isFullscreenRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
      isFullscreenRef.current = false;
    } catch {}
  }, []);

  const logViolation = useCallback((type, description) => {
    violationCountRef.current += 1;
    if (onViolationRef.current) {
      onViolationRef.current({ type, description, timestamp: new Date().toISOString(), count: violationCountRef.current });
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // === 1. DISABLE RIGHT-CLICK ===
    const handleContextMenu = (e) => { e.preventDefault(); logViolation('RIGHT_CLICK', 'Context menu attempted'); };

    // === 2. DISABLE COPY / PASTE / CUT ===
    const handleCopy  = (e) => { e.preventDefault(); logViolation('COPY', 'Copy attempted'); };
    const handleCut   = (e) => { e.preventDefault(); logViolation('CUT', 'Cut attempted'); };
    const handlePaste = (e) => { e.preventDefault(); logViolation('PASTE', 'Paste attempted'); };

    // === 3. BLOCK DANGEROUS KEYBOARD SHORTCUTS ===
    const handleKeyDown = (e) => {
      if (e.key === 'F12') { e.preventDefault(); logViolation('F12_KEY', 'DevTools shortcut'); return; }
      if (e.key === 'F5')  { e.preventDefault(); logViolation('REFRESH', 'Page refresh attempted'); return; }

      if (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) {
        e.preventDefault(); logViolation('DEVTOOLS_SHORTCUT', `Ctrl+Shift+${e.key}`); return;
      }
      if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'N') {
        e.preventDefault(); logViolation('INCOGNITO_WINDOW', 'Incognito window attempted'); return;
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'u') { e.preventDefault(); logViolation('VIEW_SOURCE', 'View source'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); logViolation('SAVE_PAGE', 'Save page'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); logViolation('PRINT', 'Print page'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'v') { e.preventDefault(); logViolation('PASTE_SHORTCUT', 'Paste shortcut'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'x') { e.preventDefault(); logViolation('CUT_SHORTCUT', 'Cut shortcut'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'w') { e.preventDefault(); logViolation('CLOSE_TAB', 'Close tab attempted'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); logViolation('NEW_WINDOW', 'New window attempted'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 't') { e.preventDefault(); logViolation('NEW_TAB', 'New tab attempted'); return; }
      if (e.ctrlKey && e.key.toLowerCase() === 'r') { e.preventDefault(); logViolation('REFRESH', 'Page refresh attempted'); return; }

      if (e.key === 'PrintScreen') { e.preventDefault(); logViolation('PRINT_SCREEN', 'Screenshot attempted'); return; }

      if (e.altKey && e.key === 'Tab') { e.preventDefault(); logViolation('ALT_TAB', 'App switch attempted'); return; }
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); logViolation('BROWSER_NAV', 'Browser navigation'); return; }

      if (e.metaKey && e.key === 'Tab') { e.preventDefault(); logViolation('CMD_TAB', 'App switch attempted'); return; }
      if (e.metaKey && e.key.toLowerCase() === 'd') { e.preventDefault(); logViolation('WIN_SHOW_DESKTOP', 'Show desktop attempted'); return; }

      if (e.key === 'Escape' && checkFullscreen()) { e.preventDefault(); return; }

      if (e.key === 'Meta' || e.key === 'OS') { e.preventDefault(); logViolation('WIN_KEY', 'Win key pressed'); return; }
    };

    // === 4. PREVENT BROWSER BACK/FORWARD ===
    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      logViolation('BACK_BUTTON', 'Back button attempted');
    };

    // === 5. TAB SWITCHING WITH EXTENDED ABSENCE DETECTION ===
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        const now = Date.now();
        if (now - lastTabSwitchWarningRef.current > 10000) {
          toast.error(`Tab switch detected! (${tabSwitchCountRef.current}x)`);
          lastTabSwitchWarningRef.current = now;
        }
        if (onTabSwitchRef.current) {
          onTabSwitchRef.current({ count: tabSwitchCountRef.current, timestamp: new Date().toISOString() });
        }
        tabHiddenTimerRef.current = setTimeout(() => {
          if (document.hidden) {
            logViolation('EXTENDED_TAB_ABSENCE', 'Tab hidden for more than 8 seconds');
            toast.error('Extended tab absence detected!');
            if (onWindowBlurRef.current) {
              onWindowBlurRef.current({ timestamp: new Date().toISOString(), reason: 'extended_absence' });
            }
          }
        }, 8000);
      } else {
        if (tabHiddenTimerRef.current) {
          clearTimeout(tabHiddenTimerRef.current);
          tabHiddenTimerRef.current = null;
        }
      }
    };

    // === 6. WINDOW FOCUS LOSS ===
    const handleWindowBlur = () => {
      logViolation('WINDOW_BLUR', 'Window lost focus');
      const now = Date.now();
      if (now - lastWindowBlurWarningRef.current > 10000) {
        toast.warning('Window focus lost! Return to exam.');
        lastWindowBlurWarningRef.current = now;
      }
      if (onWindowBlurRef.current) {
        onWindowBlurRef.current({ timestamp: new Date().toISOString() });
      }
    };

    // === 7. FULLSCREEN ENFORCEMENT ===
    const handleFullscreenChange = () => {
      const isFS = checkFullscreen();
      isFullscreenRef.current = isFS;
      if (!isFS && enforceFullscreen) {
        logViolation('FULLSCREEN_EXIT', 'User exited fullscreen');
        const now = Date.now();
        if (now - lastFullscreenWarningRef.current > 10000) {
          toast.warning('Fullscreen exited! Returning to fullscreen...');
          lastFullscreenWarningRef.current = now;
        }
        setTimeout(() => { if (!checkFullscreen()) enterFullscreen(); }, 800);
      }
    };

    // === 8. CLIPBOARD CHANGE DETECTION ===
    const handleClipboardChange = () => {
      logViolation('CLIPBOARD_CHANGE', 'Clipboard content changed');
    };

    // === 9. MOUSE LEAVE DETECTION ===
    const handleMouseLeave = (e) => {
      if (e.relatedTarget === null) {
        const now = Date.now();
        if (now - lastMouseLeaveWarningRef.current > 15000) {
          lastMouseLeaveWarningRef.current = now;
          logViolation('MOUSE_LEAVE', 'Mouse left the document window');
          toast.warning('Mouse left exam window!');
          if (onWindowBlurRef.current) {
            onWindowBlurRef.current({ timestamp: new Date().toISOString(), reason: 'mouse_leave' });
          }
        }
      }
    };

    // === 10. BEFOREUNLOAD WARNING ===
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      logViolation('PAGE_EXIT', 'Attempted to close/navigate away');
    };

    // === 11. PAGEHIDE (mobile tab switch) ===
    const handlePageHide = () => {
      logViolation('PAGE_HIDE', 'Page hidden (possible mobile tab switch)');
    };

    // === ATTACH LISTENERS ===
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown, true);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    if (navigator.clipboard && 'onchange' in navigator.clipboard) {
      navigator.clipboard.addEventListener('change', handleClipboardChange);
    }

    const cleanup = () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      if (navigator.clipboard && 'onchange' in navigator.clipboard) {
        navigator.clipboard.removeEventListener('change', handleClipboardChange);
      }
      if (tabHiddenTimerRef.current) {
        clearTimeout(tabHiddenTimerRef.current);
        tabHiddenTimerRef.current = null;
      }
    };

    if (enforceFullscreen) {
      const timer = setTimeout(() => enterFullscreen(), 500);
      return () => { clearTimeout(timer); cleanup(); };
    }

    return cleanup;
  }, [enabled, enforceFullscreen, logViolation, enterFullscreen, checkFullscreen]);

  return {
    isFullscreen: isFullscreenRef.current,
    violationCount: violationCountRef.current,
    tabSwitchCount: tabSwitchCountRef.current,
    enterFullscreen,
    exitFullscreen,
  };
};

export default useBrowserLockdown;
