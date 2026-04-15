import React, { useEffect, useState, useCallback, useRef } from 'react';
import { UploadClient } from '@uploadcare/upload-client';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Typography,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Stack,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  IconChevronLeft,
  IconChevronRight,
  IconFlag,
  IconFlagFilled,
  IconClock,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSend,
  IconAlertCircle,
  IconShieldCheck,
  IconWifiOff,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import useBrowserLockdown from 'src/hooks/useBrowserLockdown';
import useEyeGazeTracking from 'src/hooks/useEyeGazeTracking';
import useExternalDisplayDetection from 'src/hooks/useExternalDisplayDetection';
import useAudioMonitoring from 'src/hooks/useAudioMonitoring';
import useDevToolsDetection from 'src/hooks/useDevToolsDetection';
import useNetworkMonitoring from 'src/hooks/useNetworkMonitoring';
import useDesktopSecurity from 'src/hooks/useDesktopSecurity';
import WebCam from './Components/WebCam';
import axiosInstance from '../../axios';
import { connectSocket, disconnectSocket } from '../../utils/socket';

const uploadClient = new UploadClient({ publicKey: 'e69ab6e5db6d4a41760b' });

const WARN_THRESHOLD = 5;
const CRITICAL_THRESHOLD = 15;

const TestPage = () => {
  const { examId } = useParams();
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog, resetCheatingLog, markScreenshotsAsSaved, getUnsavedScreenshots } = useCheatingLog();
  const cheatingLogRef = useRef(cheatingLog);
  useEffect(() => { cheatingLogRef.current = cheatingLog; }, [cheatingLog]);
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const webcamRef = useRef(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState(new Map());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // ── Screenshot capture helper ─────────────────────────────────────────────
  const captureScreenshot = useCallback(async (type) => {
    try {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4 || !video.videoWidth) return null;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)[1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8 = new Uint8Array(n);
      while (n--) u8[n] = bstr.charCodeAt(n);
      const file = new File([u8], `violation_${type}_${Date.now()}.jpg`, { type: mime });
      const result = await uploadClient.uploadFile(file);
      return { url: result.cdnUrl, type, detectedAt: new Date() };
    } catch { return null; }
  }, [webcamRef]);

  // Throttled notifications
  const lastNotifRef = useRef({});
  const showThrottled = useCallback((key, msg, type) => {
    const now = Date.now();
    if ((now - (lastNotifRef.current[key] || 0)) < 8000) return;
    lastNotifRef.current[key] = now;
    if (type === 'error') toast.error(msg); else toast.warning(msg);
  }, []);

  // ── Stable violation callbacks (useCallback with empty deps) ──────────────
  const onViolation = useCallback(async () => {
    const shot = await captureScreenshot('lockdown');
    updateCheatingLog(prev => ({
      browserLockdownViolations: (prev.browserLockdownViolations || 0) + 1,
      screenshots: shot ? [...(prev.screenshots || []), shot] : (prev.screenshots || []),
    }));
    showThrottled('lockdown', '🔒 Security violation detected!', 'error');
  }, [updateCheatingLog, showThrottled, captureScreenshot]);

  const onTabSwitch = useCallback(async () => {
    const shot = await captureScreenshot('tabSwitch');
    updateCheatingLog(prev => ({
      tabSwitchViolations: (prev.tabSwitchViolations || 0) + 1,
      screenshots: shot ? [...(prev.screenshots || []), shot] : (prev.screenshots || []),
    }));
    showThrottled('tab', '⚠️ Tab switch detected!', 'warning');
  }, [updateCheatingLog, showThrottled, captureScreenshot]);

  const onWindowBlur = useCallback(async () => {
    const shot = await captureScreenshot('tabSwitch');
    updateCheatingLog(prev => ({
      windowBlurViolations: (prev.windowBlurViolations || 0) + 1,
      screenshots: shot ? [...(prev.screenshots || []), shot] : (prev.screenshots || []),
    }));
    showThrottled('blur', '⚠️ Window focus lost!', 'warning');
  }, [updateCheatingLog, showThrottled, captureScreenshot]);

  const onGazeViolation = useCallback(async (info) => {
    const shot = await captureScreenshot('gazeViolation');
    updateCheatingLog(prev => ({
      gazeViolationCount: (prev.gazeViolationCount || 0) + 1,
      screenshots: shot ? [...(prev.screenshots || []), shot] : (prev.screenshots || []),
    }));
    const dir = info.direction.horizontal !== 'center' ? info.direction.horizontal
      : info.direction.vertical !== 'center' ? info.direction.vertical : 'away';
    showThrottled('gaze', `👀 Looking ${dir} — keep eyes on screen!`, 'warning');
  }, [updateCheatingLog, showThrottled, captureScreenshot]);

  const onDisplayViolation = useCallback(async (info = {}) => {
    const shot = await captureScreenshot('externalDisplay');
    updateCheatingLog(prev => ({
      externalDisplayCount: (prev.externalDisplayCount || 0) + 1,
      screenshots: shot ? [...(prev.screenshots || []), shot] : (prev.screenshots || []),
    }));
    showThrottled('display', '🖥️ External display detected! Alert sent to teacher.', 'error');

    // Emit real-time alert to teacher via socket
    try {
      const { getSocket } = await import('../../utils/socket');
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('student:display-alert', {
          examId,
          email     : userInfo?.email,
          username  : userInfo?.name,
          examName  : selectedExam?.examName,
          screenCount : info.screenCount || 2,
          screens   : info.screens || [],
          method    : info.method || 'detected',
          timestamp : new Date().toISOString(),
        });
      }
    } catch {}
  }, [updateCheatingLog, showThrottled, captureScreenshot, examId, userInfo, selectedExam]);

  const onNoiseDetected = useCallback(async () => {
    const shot = await captureScreenshot('audioViolation');
    updateCheatingLog(prev => ({
      audioViolationCount: (prev.audioViolationCount || 0) + 1,
      screenshots: shot ? [...(prev.screenshots || []), shot] : (prev.screenshots || []),
    }));
    showThrottled('audio', '🎤 Background noise detected!', 'warning');
  }, [updateCheatingLog, showThrottled, captureScreenshot]);

  const onDevToolsDetected = useCallback(async () => {
    const shot = await captureScreenshot('lockdown');
    updateCheatingLog(prev => ({
      browserLockdownViolations: (prev.browserLockdownViolations || 0) + 1,
      screenshots: shot ? [...(prev.screenshots || []), shot] : (prev.screenshots || []),
    }));
    showThrottled('devtools', '🛑 DevTools opened — violation recorded!', 'error');
  }, [updateCheatingLog, showThrottled, captureScreenshot]);

  // ── Security hooks ────────────────────────────────────────────────────────
  useBrowserLockdown({ enabled: true, enforceFullscreen: true, onViolation, onTabSwitch, onWindowBlur });

  useEyeGazeTracking({
    enabled: true,
    webcamRef,
    gazeThreshold: 0.15,
    detectionInterval: 1000,
    onGazeViolation,
  });

  useExternalDisplayDetection({ enabled: true, detectionInterval: 3000, onViolation: onDisplayViolation });

  // ── Aggressive display re-check on focus / visibility ────────────────────
  // Catches Miracast/virtual displays connected WHILE student switched away
  useEffect(() => {
    const checkDisplay = () => {
      // screen.isExtended catches Windows Miracast & physical HDMI/USB-C
      if (window.screen?.isExtended) {
        onDisplayViolation({ screenCount: 2, screens: [{ label: 'External Display', connectionType: 'External', isPrimary: false }], method: 'screen.isExtended' });
      }
      // getScreenDetails for labelled screen info (if already permitted)
      if ('getScreenDetails' in window) {
        window.getScreenDetails().then(sd => {
          if (sd.screens && sd.screens.length > 1) {
            onDisplayViolation({
              screenCount: sd.screens.length,
              screens: sd.screens.map(s => ({ label: s.label || 'External', connectionType: s.label?.toLowerCase().includes('wireless') ? 'Wireless' : 'External', isPrimary: s.isPrimary })),
              method: 'getScreenDetails',
            });
          }
        }).catch(() => {});
      }
    };

    const onFocus  = () => checkDisplay();
    const onVisible = () => { if (document.visibilityState === 'visible') checkDisplay(); };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [onDisplayViolation]);

  useAudioMonitoring({
    enabled: true,
    noiseThreshold: 45,
    sustainedMs: 2500,
    cooldownMs: 15000,
    onNoiseDetected,
  });

  useDevToolsDetection({ enabled: true, cooldownMs: 20000, onDetected: onDevToolsDetected });
  const { isOnline } = useNetworkMonitoring({ enabled: true });

  // ── Desktop security (Electron lockdown browser) ──────────────────────────
  const { isDesktopApp } = useDesktopSecurity({
    examId,
    onViolation: (v) => {
      showThrottled('desktop', `🖥️ ${v.label}`, 'error');
      updateCheatingLog(prev => ({
        ...prev,
        browserLockdownViolations: (prev.browserLockdownViolations || 0) + 1,
      }));
      captureScreenshot('desktopViolation').catch(() => {});
    },
    onBlock: (b) => {
      toast.error(`⛔ Exam force-submitted: ${b.reason}`, { autoClose: false });
      handleSubmit(true);
    },
  });

  // ── Total violations ──────────────────────────────────────────────────────
  const totalViolations =
    (cheatingLog.noFaceCount || 0) +
    (cheatingLog.multipleFaceCount || 0) +
    (cheatingLog.cellPhoneCount || 0) +
    (cheatingLog.prohibitedObjectCount || 0) +
    (cheatingLog.tabSwitchViolations || 0) +
    (cheatingLog.windowBlurViolations || 0) +
    (cheatingLog.browserLockdownViolations || 0) +
    (cheatingLog.gazeViolationCount || 0) +
    (cheatingLog.externalDisplayCount || 0) +
    (cheatingLog.audioViolationCount || 0);

  // ── Reset log + save initial entry on exam start ──────────────────────────
  useEffect(() => {
    if (!examId || !userInfo) return;
    resetCheatingLog(examId);
    const run = async () => {
      try {
        await saveCheatingLogMutation({
          examId, email: userInfo.email, username: userInfo.name,
          noFaceCount: 0, multipleFaceCount: 0, cellPhoneCount: 0,
          prohibitedObjectCount: 0, screenshots: [],
          browserLockdownViolations: 0, tabSwitchViolations: 0,
          windowBlurViolations: 0, gazeViolationCount: 0,
          externalDisplayCount: 0, audioViolationCount: 0,
        }).unwrap();
      } catch {}
    };
    run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, userInfo?.email]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || !userInfo || !selectedExam) return;
    const socket = connectSocket();
    socket.emit('student:join-exam', { examId, email: userInfo.email, username: userInfo.name, examName: selectedExam.examName });

    // Listen for server-side warnings (e.g. duplicate session detected)
    socket.on('student:warning', (data) => {
      const msg = data?.message || 'Security warning: suspicious activity detected.';
      toast.error(msg, { autoClose: 8000 });
      updateCheatingLog(prev => ({
        browserLockdownViolations: (prev.browserLockdownViolations || 0) + 1,
      }));
      // Log screenshot
      captureScreenshot('duplicateSession').catch(() => {});
    });

    // Send heartbeat every 30 seconds to keep active-student tracking alive
    const heartbeatInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('student:heartbeat', { examId, email: userInfo.email });
      }
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.off('student:warning');
      disconnectSocket();
    };
  }, [examId, userInfo, selectedExam]);

  // ── BroadcastChannel: detect same exam open in another tab/window ─────────
  useEffect(() => {
    if (!examId || !userInfo) return;
    const CHANNEL = `exam-${examId}`;
    let channel;
    try { channel = new BroadcastChannel(CHANNEL); } catch { return; }

    const myId = `${Date.now()}-${Math.random()}`;

    // Announce presence
    channel.postMessage({ type: 'ping', id: myId });

    channel.onmessage = (evt) => {
      if (!evt.data) return;
      const { type, id } = evt.data;

      if (type === 'ping' && id !== myId) {
        // Another tab/window opened this exam — reply so they know we're here too
        channel.postMessage({ type: 'pong', id: myId });

        // Log the violation here (we were already running)
        showThrottled('multiTab', '⚠️ This exam is open in another tab/window! Incident logged.', 'error');
        updateCheatingLog(prev => ({ browserLockdownViolations: (prev.browserLockdownViolations || 0) + 1 }));
        captureScreenshot('multipleTab').catch(() => {});
      }
      if (type === 'pong' && id !== myId) {
        // We just opened and found another running instance
        showThrottled('multiTab', '⚠️ Another window has this exam open! Incident logged.', 'error');
        updateCheatingLog(prev => ({ browserLockdownViolations: (prev.browserLockdownViolations || 0) + 1 }));
        captureScreenshot('multipleTab').catch(() => {});
      }
    };

    return () => { try { channel.close(); } catch {} };
  }, [examId, userInfo]);

  // ── Auto-save every 30 s ──────────────────────────────────────────────────
  useEffect(() => {
    if (!examId || !userInfo) return;
    const interval = setInterval(async () => {
      try {
        const log = cheatingLogRef.current;
        const unsaved = getUnsavedScreenshots();
        await saveCheatingLogMutation({
          examId, email: userInfo.email, username: userInfo.name,
          noFaceCount: log.noFaceCount || 0,
          multipleFaceCount: log.multipleFaceCount || 0,
          cellPhoneCount: log.cellPhoneCount || 0,
          prohibitedObjectCount: log.prohibitedObjectCount || 0,
          screenshots: unsaved,
          browserLockdownViolations: log.browserLockdownViolations || 0,
          tabSwitchViolations: log.tabSwitchViolations || 0,
          windowBlurViolations: log.windowBlurViolations || 0,
          gazeViolationCount: log.gazeViolationCount || 0,
          externalDisplayCount: log.externalDisplayCount || 0,
          audioViolationCount: log.audioViolationCount || 0,
        }).unwrap();
        markScreenshotsAsSaved(unsaved);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [examId, userInfo, saveCheatingLogMutation, getUnsavedScreenshots, markScreenshotsAsSaved]);

  const { data: questions, isLoading, isError, error } = useGetQuestionsQuery(examId);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userExamdata) return;
    const exam = userExamdata.find((e) => e.examId === examId);
    if (exam) { setSelectedExam(exam); setTimeLeft(exam.duration * 60); setExamDurationInSeconds(exam.duration); }
  }, [userExamdata, examId]);

  const handleAutoSubmitRef = useRef(null);
  handleAutoSubmitRef.current = () => { toast.warning('⏰ Time is up! Auto-submitting…'); handleSubmit(true); };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(prev => { if (prev <= 1) { handleAutoSubmitRef.current(); return 0; } return prev - 1; }), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const timerColor = () => {
    const pct = examDurationInSeconds > 0 ? (timeLeft / (examDurationInSeconds * 60)) * 100 : 100;
    if (pct > 50) return 'success'; if (pct > 20) return 'warning'; return 'error';
  };

  const getQuestionStatus = (i) => {
    if (!visitedQuestions.has(i)) return 'not-visited';
    if (markedForReview.has(i)) return 'review';
    if (answers.has(questions[i]?._id)) return 'answered';
    return 'not-answered';
  };

  const handleQuestionChange = (i) => {
    setCurrentQuestion(i);
    setVisitedQuestions(prev => new Set([...prev, i]));
    const qId = questions[i]?._id;
    setSelectedOption(qId && answers.has(qId) ? answers.get(qId) : null);
  };

  const handleOptionChange = (optId) => {
    setSelectedOption(optId);
    const qId = questions[currentQuestion]?._id;
    if (qId) setAnswers(prev => { const m = new Map(prev); m.set(qId, optId); return m; });
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const s = new Set(prev);
      if (s.has(currentQuestion)) { s.delete(currentQuestion); toast.info('Unmarked for review'); }
      else { s.add(currentQuestion); toast.info('Marked for review'); }
      return s;
    });
  };

  const handleNext = () => { if (currentQuestion < questions.length - 1) handleQuestionChange(currentQuestion + 1); };
  const handlePrevious = () => { if (currentQuestion > 0) handleQuestionChange(currentQuestion - 1); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === 'ArrowRight' && currentQuestion < (questions?.length || 0) - 1) handleNext();
      else if (e.key === 'ArrowLeft' && currentQuestion > 0) handlePrevious();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentQuestion, questions]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (force = false) => {
    if (isSubmitting) return;
    const unanswered = questions.length - answers.size;
    // Show dialog if not forced (auto-submit bypasses dialog)
    if (!force && unanswered > 0) {
      setSubmitDialogOpen(true);
      return;
    }
    setSubmitDialogOpen(false);
    try {
      setIsSubmitting(true);
      await axiosInstance.post('/api/users/results', { examId, answers: Object.fromEntries(answers) }, { withCredentials: true });
      await saveCheatingLogMutation({
        examId, email: userInfo.email, username: userInfo.name,
        noFaceCount: cheatingLog.noFaceCount || 0,
        multipleFaceCount: cheatingLog.multipleFaceCount || 0,
        cellPhoneCount: cheatingLog.cellPhoneCount || 0,
        prohibitedObjectCount: cheatingLog.prohibitedObjectCount || 0,
        screenshots: getUnsavedScreenshots(),
        browserLockdownViolations: cheatingLog.browserLockdownViolations || 0,
        tabSwitchViolations: cheatingLog.tabSwitchViolations || 0,
        windowBlurViolations: cheatingLog.windowBlurViolations || 0,
        gazeViolationCount: cheatingLog.gazeViolationCount || 0,
        externalDisplayCount: cheatingLog.externalDisplayCount || 0,
        audioViolationCount: cheatingLog.audioViolationCount || 0,
      }).unwrap();
      toast.success('Test submitted!');
      navigate(`/exam/${examId}/codedetails`);
    } catch {
      toast.error('Submit failed. Try again.');
      setIsSubmitting(false);
    }
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (isExamsLoading || isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"><CircularProgress size={60} /></Box>;
  }

  if (isError) {
    return (
      <PageContainer title="Exam" description="Error">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Alert severity="error" sx={{ maxWidth: 600 }} action={<Button color="inherit" size="small" onClick={() => navigate('/exam')}>Back</Button>}>
            <Typography variant="h6" gutterBottom>{error?.status === 403 ? 'Access Denied' : 'Error'}</Typography>
            <Typography variant="body2">{error?.data?.message || 'Failed to load exam'}</Typography>
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <PageContainer title="Exam" description="No questions">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Alert severity="warning" sx={{ maxWidth: 600 }} action={<Button color="inherit" size="small" onClick={() => navigate('/exam')}>Back</Button>}>
            <Typography variant="h6">No Questions Available</Typography>
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const tColor = timerColor();

  const unansweredCount = questions ? questions.length - answers.size : 0;

  return (
    <PageContainer title="Exam" description="Online Examination">

      {/* ── Submit Confirmation Dialog ── */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        sx={{ '& .MuiDialog-paper': { backgroundColor: '#1C1C1E', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '18px', minWidth: 360 } }}
      >
        <DialogTitle sx={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '1.0625rem', pt: 3 }}>
          Submit Exam?
        </DialogTitle>
        <DialogContent>
          <List dense disablePadding>
            <ListItem disableGutters>
              <ListItemText
                primary={`✅ Answered: ${answers.size} / ${questions?.length || 0}`}
                primaryTypographyProps={{ sx: { color: '#30D158', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' } }}
              />
            </ListItem>
            {unansweredCount > 0 && (
              <ListItem disableGutters>
                <ListItemText
                  primary={`⚠️ Unanswered: ${unansweredCount} question${unansweredCount > 1 ? 's' : ''}`}
                  primaryTypographyProps={{ sx: { color: '#FF9F0A', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' } }}
                />
              </ListItem>
            )}
            {markedForReview.size > 0 && (
              <ListItem disableGutters>
                <ListItemText
                  primary={`🚩 Marked for review: ${markedForReview.size}`}
                  primaryTypographyProps={{ sx: { color: '#FFD60A', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' } }}
                />
              </ListItem>
            )}
            <ListItem disableGutters>
              <ListItemText
                primary={`⏱ Time remaining: ${formatTime(timeLeft)}`}
                primaryTypographyProps={{ sx: { color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' } }}
              />
            </ListItem>
            {totalViolations > 0 && (
              <ListItem disableGutters>
                <ListItemText
                  primary={`🚨 Total violations: ${totalViolations}`}
                  primaryTypographyProps={{ sx: { color: '#FF453A', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' } }}
                />
              </ListItem>
            )}
          </List>
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif', mt: 1.5 }}>
            Once submitted, you cannot change your answers.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setSubmitDialogOpen(false)}
            startIcon={<IconX size={15} />}
            sx={{ color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', textTransform: 'none', borderRadius: '10px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' } }}
          >
            Go Back
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            variant="contained"
            startIcon={<IconCheck size={15} />}
            sx={{ backgroundColor: '#0A84FF', color: '#fff', fontFamily: 'Inter, sans-serif', textTransform: 'none', borderRadius: '10px', fontWeight: 600, '&:hover': { backgroundColor: '#409CFF' } }}
          >
            Yes, Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Offline Banner ── */}
      {!isOnline && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000, bgcolor: '#FF453A', py: 0.75, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <IconWifiOff size={16} color="#fff" />
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>
            Internet disconnected — reconnect immediately to avoid losing your exam!
          </Typography>
        </Box>
      )}

      {/* ── Violation banner ── */}
      {totalViolations >= CRITICAL_THRESHOLD && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, bgcolor: '#FF453A', py: 0.75, textAlign: 'center' }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>
            🚨 CRITICAL: {totalViolations} violations detected. Continued violations may result in auto-submission.
          </Typography>
        </Box>
      )}
      {totalViolations >= WARN_THRESHOLD && totalViolations < CRITICAL_THRESHOLD && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, bgcolor: '#FF9F0A', py: 0.75, textAlign: 'center' }}>
          <Typography sx={{ color: '#000', fontWeight: 600, fontSize: '0.875rem' }}>
            ⚠️ Warning: {totalViolations} violations recorded. Your exam is being monitored.
          </Typography>
        </Box>
      )}

      <Box sx={{ height: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', mt: totalViolations >= WARN_THRESHOLD ? '36px' : 0 }}>
        {/* ── Header ── */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 0, flexShrink: 0 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <Typography variant="h6" fontWeight={600}>{selectedExam?.examName || 'Exam'}</Typography>
              <Typography variant="caption" color="text.secondary">Q {currentQuestion + 1} / {questions.length}</Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 1 }} color={tColor} />
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip label={`Answered: ${answers.size}`} color="success" size="small" variant="outlined" />
                <Chip label={`Not Answered: ${visitedQuestions.size - answers.size}`} color="error" size="small" variant="outlined" />
                <Chip label={`Marked: ${markedForReview.size}`} color="warning" size="small" variant="outlined" />
                <Chip label={`Not Visited: ${questions.length - visitedQuestions.size}`} color="default" size="small" variant="outlined" />
              </Stack>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box display="flex" justifyContent="center">
                <Paper elevation={3} sx={{
                  px: 2.5, py: 1.5, borderRadius: 3, color: 'white', display: 'flex', alignItems: 'center', gap: 1.5,
                  background: tColor === 'error' ? 'linear-gradient(135deg,#ff5252,#f44336)' : tColor === 'warning' ? 'linear-gradient(135deg,#ffa726,#fb8c00)' : 'linear-gradient(135deg,#66bb6a,#43a047)',
                }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress variant="determinate" value={100} size={44} thickness={3} sx={{ color: 'rgba(255,255,255,0.2)', position: 'absolute' }} />
                    <CircularProgress variant="determinate" value={examDurationInSeconds > 0 ? (timeLeft / (examDurationInSeconds * 60)) * 100 : 100} size={44} thickness={3}
                      sx={{ color: 'white', '& .MuiCircularProgress-circle': { strokeLinecap: 'round' } }} />
                    <Box sx={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconClock size={20} color="white" />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1, fontFamily: 'monospace' }}>{formatTime(timeLeft)}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.95, fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase' }}>Time Left</Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" color="error" size="large" startIcon={<IconSend />} onClick={() => handleSubmit(false)} disabled={isSubmitting} fullWidth sx={{ px: 4, py: 1.5 }}>
                {isSubmitting ? 'Submitting…' : 'Submit Test'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* ── Main Content ── */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Question Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ flex: 1, overflow: 'hidden', p: 3, display: 'flex', flexDirection: 'column' }}>
              <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                <Box mb={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h5" fontWeight={600} color="primary">Question {currentQuestion + 1}</Typography>
                    <Tooltip title={markedForReview.has(currentQuestion) ? 'Unmark for review' : 'Mark for review'}>
                      <IconButton onClick={toggleMarkForReview} color={markedForReview.has(currentQuestion) ? 'warning' : 'default'}>
                        {markedForReview.has(currentQuestion) ? <IconFlagFilled size={24} /> : <IconFlag size={24} />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Divider />
                </Box>
                <Box mb={4}>
                  <Typography variant="body1" fontSize="1.1rem" lineHeight={1.8} dangerouslySetInnerHTML={{ __html: currentQ?.question }} />
                </Box>
                <Stack spacing={2}>
                  {currentQ?.options?.map((opt, i) => (
                    <Paper key={opt._id} elevation={selectedOption === opt._id ? 3 : 1} onClick={() => handleOptionChange(opt._id)}
                      sx={{ p: 2.5, cursor: 'pointer', border: '2px solid', transition: 'all 0.2s', borderColor: selectedOption === opt._id ? 'primary.main' : 'divider', bgcolor: selectedOption === opt._id ? 'primary.lighter' : 'background.paper', '&:hover': { borderColor: 'primary.main', transform: 'translateX(8px)' } }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid', flexShrink: 0, borderColor: selectedOption === opt._id ? 'primary.main' : 'divider', bgcolor: selectedOption === opt._id ? 'primary.main' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: selectedOption === opt._id ? 'white' : 'text.primary' }}>
                          {String.fromCharCode(65 + i)}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: selectedOption === opt._id ? 600 : 400, color: selectedOption === opt._id ? 'primary.main' : 'text.primary' }}>
                          {opt.optionText}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Box>

            {/* Navigation Footer */}
            <Paper elevation={3} sx={{ p: 2, borderRadius: 0, flexShrink: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                <Button variant="outlined" startIcon={<IconChevronLeft />} onClick={handlePrevious} disabled={currentQuestion === 0} size="large" sx={{ minWidth: 150 }}>Previous</Button>
                <Button variant="outlined" color="warning" onClick={toggleMarkForReview} startIcon={markedForReview.has(currentQuestion) ? <IconFlagFilled /> : <IconFlag />} size="large" sx={{ minWidth: 200 }}>
                  {markedForReview.has(currentQuestion) ? 'Unmark for Review' : 'Mark for Review'}
                </Button>
                <Button variant="contained" endIcon={<IconChevronRight />} onClick={handleNext} disabled={currentQuestion === questions.length - 1} size="large" sx={{ minWidth: 150 }}>Next</Button>
              </Stack>
            </Paper>
          </Box>

          {/* ── Right Sidebar ── */}
          <Collapse orientation="horizontal" in={sidebarOpen} collapsedSize={0}>
            <Paper elevation={3} sx={{ width: 320, display: 'flex', flexDirection: 'column', borderLeft: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              {/* Webcam */}
              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5} display="flex" alignItems="center" gap={0.75}>
                  <IconAlertCircle size={18} /> AI Proctoring Active
                </Typography>
                <Paper elevation={2} sx={{ overflow: 'hidden', borderRadius: 2 }}>
                  <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} webcamRef={webcamRef} />
                </Paper>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
                  Session is being monitored and recorded.
                </Typography>
              </Box>

              <Divider />

              {/* Live Violation Status */}
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1} display="flex" alignItems="center" gap={0.75}>
                  <IconShieldCheck size={16} /> Security Status
                </Typography>
                {isDesktopApp && (
                  <Box sx={{ mb: 1, px: 1, py: 0.5, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', animation: 'pulse 2s infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                    <Typography variant="caption" fontWeight={600} color="primary.dark">Desktop Security Active</Typography>
                  </Box>
                )}
                <Stack spacing={0.5}>
                  {[
                    { label: 'No Face', count: cheatingLog.noFaceCount || 0, icon: '👤' },
                    { label: 'Multi-Face', count: cheatingLog.multipleFaceCount || 0, icon: '👥' },
                    { label: 'Phone', count: cheatingLog.cellPhoneCount || 0, icon: '📱' },
                    { label: 'Prohibited Object', count: cheatingLog.prohibitedObjectCount || 0, icon: '📚' },
                    { label: 'Tab Switch', count: cheatingLog.tabSwitchViolations || 0, icon: '🔄' },
                    { label: 'Window Blur', count: cheatingLog.windowBlurViolations || 0, icon: '🪟' },
                    { label: 'Lockdown', count: cheatingLog.browserLockdownViolations || 0, icon: '🔒' },
                    { label: 'Gaze Away', count: cheatingLog.gazeViolationCount || 0, icon: '👀' },
                    { label: 'Ext. Display', count: cheatingLog.externalDisplayCount || 0, icon: '🖥️' },
                    { label: 'Audio Noise', count: cheatingLog.audioViolationCount || 0, icon: '🎤' },
                  ].map(({ label, count, icon }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 0.35, borderRadius: 1, bgcolor: count > 0 ? (count > 3 ? 'error.lighter' : 'warning.lighter') : 'success.lighter' }}>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>{icon} {label}</Typography>
                      <Chip label={count} size="small" color={count === 0 ? 'success' : count > 3 ? 'error' : 'warning'} sx={{ height: 18, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }} />
                    </Box>
                  ))}
                </Stack>
                <Box sx={{ mt: 1, p: 1, borderRadius: 1, textAlign: 'center', bgcolor: totalViolations === 0 ? 'success.lighter' : totalViolations >= CRITICAL_THRESHOLD ? 'error.lighter' : 'warning.lighter' }}>
                  <Typography variant="caption" fontWeight={700} color={totalViolations === 0 ? 'success.dark' : totalViolations >= CRITICAL_THRESHOLD ? 'error.dark' : 'warning.dark'}>
                    Total Violations: {totalViolations}
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Question Palette */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={2}>Question Palette</Typography>
                <Grid container spacing={1}>
                  {questions.map((_, i) => {
                    const status = getQuestionStatus(i);
                    const isActive = currentQuestion === i;
                    let bg = 'background.paper', border = 'divider', col = 'text.primary';
                    if (status === 'answered') { bg = 'success.lighter'; border = 'success.main'; col = 'success.dark'; }
                    else if (status === 'review') { bg = 'warning.lighter'; border = 'warning.main'; col = 'warning.dark'; }
                    else if (status === 'not-answered') { bg = 'error.lighter'; border = 'error.main'; col = 'error.dark'; }
                    return (
                      <Grid item xs={3} key={i}>
                        <Tooltip title={`Q${i + 1} — ${status.replace('-', ' ')}`}>
                          <Paper elevation={isActive ? 4 : 1} onClick={() => handleQuestionChange(i)}
                            sx={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid', borderColor: isActive ? 'primary.main' : border, bgcolor: isActive ? 'primary.main' : bg, color: isActive ? 'white' : col, fontWeight: 600, transition: 'all 0.2s', '&:hover': { transform: 'scale(1.1)', zIndex: 1 } }}>
                            {i + 1}
                          </Paper>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>
                <Box mt={2}>
                  <Typography variant="caption" fontWeight={600} display="block" mb={1}>Legend</Typography>
                  <Stack spacing={0.75}>
                    {[['success.lighter','success.main','Answered'],['error.lighter','error.main','Not Answered'],['warning.lighter','warning.main','Marked for Review'],['background.paper','divider','Not Visited']].map(([bg,bd,lbl]) => (
                      <Stack key={lbl} direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 16, height: 16, bgcolor: bg, border: '2px solid', borderColor: bd, borderRadius: 0.5 }} />
                        <Typography variant="caption">{lbl}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Paper>
          </Collapse>

          {/* Sidebar Toggle */}
          <Box sx={{ position: 'fixed', right: sidebarOpen ? 320 : 0, top: '50%', transform: 'translateY(-50%)', zIndex: 1000, transition: 'right 0.3s' }}>
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: '8px 0 0 8px', '&:hover': { bgcolor: 'primary.dark' } }}>
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse /> : <IconLayoutSidebarLeftExpand />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default TestPage;
