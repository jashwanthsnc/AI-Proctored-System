import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for browser lockdown during exams
 * Implements comprehensive security measures to prevent cheating
 * 
 * @param {Object} options Configuration options
 * @param {boolean} options.enabled Whether lockdown is active
 * @param {Function} options.onViolation Callback when a violation is detected
 * @param {Function} options.onTabSwitch Callback when tab switch is detected
 * @param {Function} options.onWindowBlur Callback when window loses focus
 * @param {boolean} options.enforceFullscreen Whether to enforce fullscreen mode
 * @returns {Object} Lockdown state and controls
 */
const useBrowserLockdown = ({
  enabled = true,
  onViolation = null,
  onTabSwitch = null,
  onWindowBlur = null,
  enforceFullscreen = true,
} = {}) => {
  const isFullscreenRef = useRef(false);
  const violationCountRef = useRef(0);
  const tabSwitchCountRef = useRef(0);
  
  // Rate limiting: Track last time warnings were shown
  const lastTabSwitchWarningRef = useRef(0);
  const lastWindowBlurWarningRef = useRef(0);
  const lastFullscreenWarningRef = useRef(0);

  // Check if document is in fullscreen
  const checkFullscreen = useCallback(() => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }, []);

  // Enter fullscreen mode
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      isFullscreenRef.current = true;
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      return false;
    }
  }, []);

  // Exit fullscreen mode
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      isFullscreenRef.current = false;
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Log violation
  const logViolation = useCallback((type, description) => {
    violationCountRef.current += 1;
    console.warn(`🚨 Lockdown Violation #${violationCountRef.current}:`, type, description);
    
    if (onViolation) {
      onViolation({
        type,
        description,
        timestamp: new Date().toISOString(),
        count: violationCountRef.current,
      });
    }
  }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    // === 1. DISABLE RIGHT-CLICK ===
    const handleContextMenu = (e) => {
      e.preventDefault();
      logViolation('RIGHT_CLICK', 'Attempted to open context menu');
      return false;
    };

    // === 2. DISABLE COPY/PASTE ===
    const handleCopy = (e) => {
      e.preventDefault();
      logViolation('COPY', 'Attempted to copy content');
      return false;
    };

    const handleCut = (e) => {
      e.preventDefault();
      logViolation('CUT', 'Attempted to cut content');
      return false;
    };

    const handlePaste = (e) => {
      e.preventDefault();
      logViolation('PASTE', 'Attempted to paste content');
      return false;
    };

    // === 3. DISABLE PRINT SCREEN & KEYBOARD SHORTCUTS ===
    const handleKeyDown = (e) => {
      const forbiddenKeys = [
        'F12', // Developer tools
        'F11', // Fullscreen toggle (we control this)
        'PrintScreen', // Screenshot
        'I', // Ctrl+Shift+I (DevTools)
        'J', // Ctrl+Shift+J (Console)
        'C', // Ctrl+Shift+C (Element inspector)
        'U', // Ctrl+U (View source)
      ];

      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        logViolation('F12_KEY', 'Attempted to open developer tools');
        return false;
      }

      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        logViolation('DEVTOOLS_SHORTCUT', 'Attempted to open developer tools');
        return false;
      }

      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        logViolation('CONSOLE_SHORTCUT', 'Attempted to open console');
        return false;
      }

      // Block Ctrl+Shift+C (Element inspector)
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        logViolation('INSPECTOR_SHORTCUT', 'Attempted to open element inspector');
        return false;
      }

      // Block Ctrl+U (View source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        logViolation('VIEW_SOURCE', 'Attempted to view page source');
        return false;
      }

      // Block Ctrl+S (Save page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        logViolation('SAVE_PAGE', 'Attempted to save page');
        return false;
      }

      // Block Ctrl+P (Print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        logViolation('PRINT', 'Attempted to print page');
        return false;
      }

      // Block PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('PRINT_SCREEN', 'Attempted to take screenshot');
        return false;
      }

      // Block Ctrl+C (Copy) - already handled by copy event, but double-check
      if (e.ctrlKey && e.key === 'c' && !e.shiftKey) {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          e.preventDefault();
          logViolation('COPY_SHORTCUT', 'Attempted to copy with keyboard');
          return false;
        }
      }

      // Block Ctrl+V (Paste)
      if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        logViolation('PASTE_SHORTCUT', 'Attempted to paste with keyboard');
        return false;
      }

      // Block Ctrl+X (Cut)
      if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        logViolation('CUT_SHORTCUT', 'Attempted to cut with keyboard');
        return false;
      }

      // Block Alt+Tab (Windows) - Limited effectiveness
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        logViolation('ALT_TAB', 'Attempted to switch applications');
        return false;
      }

      // Block Cmd+Tab (Mac) - Limited effectiveness
      if (e.metaKey && e.key === 'Tab') {
        e.preventDefault();
        logViolation('CMD_TAB', 'Attempted to switch applications');
        return false;
      }

      // Block browser back/forward navigation
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        logViolation('BROWSER_NAVIGATION', 'Attempted to navigate with keyboard');
        return false;
      }
    };

    // === 4. PREVENT BROWSER BACK/FORWARD NAVIGATION ===
    const handlePopState = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      logViolation('BACK_BUTTON', 'Attempted to use browser back button');
    };

    // === 5. DETECT TAB SWITCHING (visibility change) ===
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        logViolation('TAB_SWITCH', `User switched tabs or minimized window (Count: ${tabSwitchCountRef.current})`);
        
        // Show warning only once every 30 seconds to prevent spam
        const now = Date.now();
        if (now - lastTabSwitchWarningRef.current > 30000) {
          toast.error(`⚠️ Tab switch detected! Count: ${tabSwitchCountRef.current}`);
          lastTabSwitchWarningRef.current = now;
        }
        
        if (onTabSwitch) {
          onTabSwitch({
            count: tabSwitchCountRef.current,
            timestamp: new Date().toISOString(),
          });
        }
      }
    };

    // === 6. DETECT WINDOW FOCUS LOSS ===
    const handleWindowBlur = () => {
      logViolation('WINDOW_BLUR', 'Window lost focus');
      
      // Show warning only once every 30 seconds to prevent spam
      const now = Date.now();
      if (now - lastWindowBlurWarningRef.current > 30000) {
        toast.warning('⚠️ Window focus lost! Stay on the exam page');
        lastWindowBlurWarningRef.current = now;
      }
      
      if (onWindowBlur) {
        onWindowBlur({
          timestamp: new Date().toISOString(),
        });
      }
    };

    const handleWindowFocus = () => {
      // Optional: Log when focus is regained
      console.log('✅ Window focus regained');
    };

    // === 7. FULLSCREEN ENFORCEMENT ===
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = checkFullscreen();
      isFullscreenRef.current = isCurrentlyFullscreen;

      if (!isCurrentlyFullscreen && enforceFullscreen) {
        logViolation('FULLSCREEN_EXIT', 'User exited fullscreen mode');
        
        // Show warning only once every 30 seconds to prevent spam
        const now = Date.now();
        if (now - lastFullscreenWarningRef.current > 30000) {
          toast.warning('⚠️ Fullscreen mode exited! Please return to fullscreen');
          lastFullscreenWarningRef.current = now;
        }
        
        // Attempt to re-enter fullscreen after a short delay
        setTimeout(() => {
          if (!checkFullscreen()) {
            enterFullscreen();
          }
        }, 1000);
      }
    };

    // === ATTACH EVENT LISTENERS ===
    
    // Right-click
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Copy/Cut/Paste
    document.addEventListener('copy', handleCopy);
    document.addEventListener('cut', handleCut);
    document.addEventListener('paste', handlePaste);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
    
    // Browser navigation
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    
    // Tab switching
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Window focus
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    // Fullscreen
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Enter fullscreen on mount if enforced
    if (enforceFullscreen) {
      const timer = setTimeout(() => {
        enterFullscreen();
      }, 500);
      
      return () => clearTimeout(timer);
    }

    // === CLEANUP ON UNMOUNT ===
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [
    enabled,
    enforceFullscreen,
    onViolation,
    onTabSwitch,
    onWindowBlur,
    logViolation,
    enterFullscreen,
    checkFullscreen,
  ]);

  return {
    isFullscreen: isFullscreenRef.current,
    violationCount: violationCountRef.current,
    tabSwitchCount: tabSwitchCountRef.current,
    enterFullscreen,
    exitFullscreen,
  };
};

export default useBrowserLockdown;
