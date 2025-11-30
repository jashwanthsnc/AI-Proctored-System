import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const CheatingLogContext = createContext();

export const CheatingLogProvider = ({ children }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    noFaceCount: 0,
    multipleFaceCount: 0,
    cellPhoneCount: 0,
    prohibitedObjectCount: 0,
    browserLockdownViolations: 0,
    tabSwitchViolations: 0,
    windowBlurViolations: 0,
    examId: '',
    username: userInfo?.name || '',
    email: userInfo?.email || '',
    screenshots: [], // Initialize screenshots array
  });

  // Track which screenshots have been saved to DB
  const [savedScreenshotUrls, setSavedScreenshotUrls] = useState(new Set());

  useEffect(() => {
    if (userInfo) {
      setCheatingLog((prev) => ({
        ...prev,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  const updateCheatingLog = (newLogOrUpdater) => {
    setCheatingLog((prev) => {
      // Support both direct object and function (like setState)
      const newLog = typeof newLogOrUpdater === 'function' 
        ? newLogOrUpdater(prev) 
        : newLogOrUpdater;
      
      // Merge previous and new log, with new log taking priority
      const updatedLog = {
        ...prev,
        ...newLog,
        // Only update counts if they're explicitly provided in newLog
        // Use !== undefined to check if the field exists
        noFaceCount: newLog.noFaceCount !== undefined 
          ? Number(newLog.noFaceCount) 
          : Number(prev.noFaceCount || 0),
        multipleFaceCount: newLog.multipleFaceCount !== undefined
          ? Number(newLog.multipleFaceCount)
          : Number(prev.multipleFaceCount || 0),
        cellPhoneCount: newLog.cellPhoneCount !== undefined
          ? Number(newLog.cellPhoneCount)
          : Number(prev.cellPhoneCount || 0),
        prohibitedObjectCount: newLog.prohibitedObjectCount !== undefined
          ? Number(newLog.prohibitedObjectCount)
          : Number(prev.prohibitedObjectCount || 0),
        browserLockdownViolations: newLog.browserLockdownViolations !== undefined
          ? Number(newLog.browserLockdownViolations)
          : Number(prev.browserLockdownViolations || 0),
        tabSwitchViolations: newLog.tabSwitchViolations !== undefined
          ? Number(newLog.tabSwitchViolations)
          : Number(prev.tabSwitchViolations || 0),
        windowBlurViolations: newLog.windowBlurViolations !== undefined
          ? Number(newLog.windowBlurViolations)
          : Number(prev.windowBlurViolations || 0),
        // Preserve or update screenshots array
        screenshots: newLog.screenshots !== undefined
          ? newLog.screenshots
          : (prev.screenshots || []),
      };
      console.log('📝 Context Update:', {
        before: prev,
        incoming: newLog,
        after: updatedLog
      });
      return updatedLog;
    });
  };

  const resetCheatingLog = (examId) => {
    const resetLog = {
      noFaceCount: 0,
      multipleFaceCount: 0,
      cellPhoneCount: 0,
      prohibitedObjectCount: 0,
      browserLockdownViolations: 0,
      tabSwitchViolations: 0,
      windowBlurViolations: 0,
      examId: examId,
      username: userInfo?.name || '',
      email: userInfo?.email || '',
      screenshots: [], // Reset screenshots array
    };
    console.log('Reset cheating log:', resetLog); // Debug log
    setCheatingLog(resetLog);
    setSavedScreenshotUrls(new Set()); // Reset saved screenshot tracking
  };

  // Mark screenshots as saved (to be called after successful save)
  const markScreenshotsAsSaved = (screenshots) => {
    if (screenshots && screenshots.length > 0) {
      setSavedScreenshotUrls((prev) => {
        const newSet = new Set(prev);
        screenshots.forEach((s) => {
          if (s.url) newSet.add(s.url);
        });
        return newSet;
      });
    }
  };

  // Get only unsaved screenshots for auto-save
  const getUnsavedScreenshots = () => {
    if (!cheatingLog.screenshots || cheatingLog.screenshots.length === 0) {
      return [];
    }
    return cheatingLog.screenshots.filter((s) => !savedScreenshotUrls.has(s.url));
  };

  return (
    <CheatingLogContext.Provider
      value={{
        cheatingLog,
        updateCheatingLog,
        resetCheatingLog,
        markScreenshotsAsSaved,
        getUnsavedScreenshots,
      }}
    >
      {children}
    </CheatingLogContext.Provider>
  );
};

export const useCheatingLog = () => {
  const context = useContext(CheatingLogContext);
  if (!context) {
    throw new Error('useCheatingLog must be used within a CheatingLogProvider');
  }
  return context;
};
