import {
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import { uniqueId } from 'lodash';
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetQuestionsQuery, useGetExamsQuery } from 'src/slices/examApiSlice';
import { IconCamera, IconMaximize, IconCheck, IconAlertCircle, IconDeviceDesktop, IconShieldCheck, IconX, IconBrain, IconBook, IconPercentage, IconClock, IconHash, IconMinus, IconWifi, IconUsb, IconBluetooth } from '@tabler/icons-react';
import { loadModels, areModelsReady, resetModels } from 'src/utils/modelSingleton';
import useExternalDisplayDetection from 'src/hooks/useExternalDisplayDetection';

const RequirementRow = ({ icon: Icon, label, met, onAction, actionLabel }) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    p: 1.5,
    borderRadius: '10px',
    backgroundColor: met ? 'rgba(48,209,88,0.08)' : 'rgba(255,255,255,0.04)',
    border: `0.5px solid ${met ? 'rgba(48,209,88,0.2)' : 'rgba(255,255,255,0.08)'}`,
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: met ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={met ? '#30D158' : 'rgba(235,235,245,0.4)'} />
      </Box>
      <Typography sx={{ fontSize: '0.875rem', color: met ? '#FFFFFF' : 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif', fontWeight: met ? 500 : 400 }}>
        {label}
      </Typography>
    </Box>
    {met ? (
      <IconCheck size={16} color="#30D158" />
    ) : onAction ? (
      <Button
        size="small"
        onClick={onAction}
        sx={{ color: '#0A84FF', fontSize: '0.8125rem', fontFamily: 'Inter, sans-serif', textTransform: 'none', px: 1.5, py: 0.5, borderRadius: '20px', minWidth: 0, fontWeight: 500, '&:hover': { backgroundColor: 'rgba(10,132,255,0.1)' } }}
      >
        {actionLabel || 'Enable'}
      </Button>
    ) : (
      <IconX size={16} color="rgba(235,235,245,0.3)" />
    )}
  </Box>
);

const DescriptionAndInstructions = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { isLoading, isError, error } = useGetQuestionsQuery(examId);
  const { data: examsData } = useGetExamsQuery();
  const examInfo = examsData?.find((e) => e.examId === examId);

  const testId = uniqueId();
  const [certify, setCertify] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  // Screen monitoring is always active via the hook — no user action required
  // (getScreenDetails enhanced permission is requested automatically by the hook on first click)
  const screenPermission = true;
  const [aiModelStatus, setAiModelStatus] = useState(() => areModelsReady() ? 'ready' : 'idle');
  const [aiProgress, setAiProgress] = useState(areModelsReady() ? 100 : 0);
  const videoRef = useRef(null);

  // External display detection — exam must not start if extra screen is connected
  const { isExternalDisplayDetected, detectedScreens, screenCount, isSupported, detectionMethod, hasPermission } = useExternalDisplayDetection({
    enabled: true,
    detectionInterval: 3000,
  });

  // Pre-load AI models during setup so exam starts instantly
  useEffect(() => {
    if (areModelsReady()) return;
    setAiModelStatus('loading');
    setAiProgress(0);
    loadModels((pct) => setAiProgress(pct))
      .then(() => setAiModelStatus('ready'))
      .catch(() => setAiModelStatus('error'));
  }, []);

  const retryLoadModels = () => {
    resetModels();
    setAiModelStatus('loading');
    setAiProgress(0);
    loadModels((pct) => setAiProgress(pct))
      .then(() => setAiModelStatus('ready'))
      .catch(() => setAiModelStatus('error'));
  };

  useEffect(() => {
    requestCameraAccess();
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        toast.warning('Please enable fullscreen for the test');
      }
    };
    requestFullscreen();
    const handleFullscreenChange = () => { setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setCameraError(null);
      toast.success('Camera access granted');
    } catch (err) {
      setCameraError(err.message);
      toast.error('Camera access denied');
    }
  };

  const retryFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      toast.error('Failed to enable fullscreen');
    }
  };

  const handleTest = () => {
    if (!isFullscreen) { toast.error('Please enable fullscreen mode'); return; }
    if (!cameraStream) { toast.error('Camera access is required'); return; }
    navigate(`/exam/${examId}/${testId}`);
  };

  const aiReady = aiModelStatus === 'ready' || areModelsReady();
  // AI models are optional — exam can start even if CDN download fails.
  // Other monitoring (browser lockdown, eye gaze, audio) still works.
  const canStartTest = certify && isFullscreen && cameraStream && screenPermission && !isExternalDisplayDetected;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0A84FF' }} />
      </Box>
    );
  }

  if (isError) {
    const isNotAuthorized = error?.status === 403;
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ backgroundColor: 'rgba(255,69,58,0.1)', border: '0.5px solid rgba(255,69,58,0.3)', borderRadius: '14px', p: 3, mb: 2 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#FF453A', fontFamily: 'Inter, sans-serif', mb: 0.75 }}>
            {isNotAuthorized ? 'Access Denied' : 'Error Loading Exam'}
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif' }}>
            {isNotAuthorized
              ? 'You are not authorised to access this exam. Please contact your teacher.'
              : error?.data?.message || 'Failed to load exam details'}
          </Typography>
        </Box>
        <Button
          onClick={() => navigate('/exams')}
          sx={{ color: '#0A84FF', textTransform: 'none', fontFamily: 'Inter, sans-serif' }}
        >
          Back to Exams
        </Button>
      </Box>
    );
  }

  const defaultInstructions = [
    'This exam consists of MCQ questions.',
    'Do not switch browser tabs during the test — it will be flagged as a violation.',
    'The test runs in fullscreen mode only. Exiting fullscreen will end the test.',
    examInfo?.negativeMarking > 0
      ? `Negative marking: ${examInfo.negativeMarking} mark(s) deducted per wrong answer.`
      : 'There is no negative marking for wrong answers.',
    'Clicking Next/Back saves your answer automatically.',
    examInfo?.allowReview !== false ? 'You can revisit answered questions before submitting.' : 'Once you move to the next question, you cannot go back.',
    'Click "Finish Test" once you are done.',
    `Passing score: ${examInfo?.passingScore || 60}%. Scores are visible immediately after submission.`,
  ];
  const instructions = examInfo?.instructions
    ? examInfo.instructions.split('\n').filter(Boolean)
    : defaultInstructions;

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '9px', backgroundColor: 'rgba(10,132,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconShieldCheck size={18} color="#0A84FF" />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.375rem', color: '#FFFFFF', letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif' }}>
            Pre-Exam Setup
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.45)', fontFamily: 'Inter, sans-serif', ml: 6.5 }}>
          Complete all requirements before starting
        </Typography>
      </Box>

      {/* Exam Info Card */}
      {examInfo && (
        <Box sx={{ mb: 3, backgroundColor: 'rgba(10,132,255,0.06)', border: '0.5px solid rgba(10,132,255,0.15)', borderRadius: '12px', p: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', mb: 0.5, letterSpacing: '-0.02em' }}>
            {examInfo.examName}
          </Typography>
          {examInfo.subject && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
              <IconBook size={13} color="#0A84FF" />
              <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif' }}>{examInfo.subject}</Typography>
            </Box>
          )}
          {examInfo.description && (
            <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.5)', fontFamily: 'Inter, sans-serif', mb: 1.25, lineHeight: 1.5 }}>{examInfo.description}</Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
            {[
              { icon: IconClock, label: `${examInfo.duration} min`, color: '#0A84FF' },
              { icon: IconHash, label: `${examInfo.totalQuestions} questions`, color: '#5E5CE6' },
              { icon: IconPercentage, label: `Pass: ${examInfo.passingScore || 60}%`, color: '#30D158' },
              ...(examInfo.marksPerQuestion ? [{ icon: IconMinus, label: `${examInfo.marksPerQuestion} mark/q`, color: '#FF9F0A' }] : []),
            ].map(({ icon: Icon, label, color }) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Icon size={13} color={color} />
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(235,235,245,0.55)', fontFamily: 'Inter, sans-serif' }}>{label}</Typography>
              </Box>
            ))}
          </Box>
          {(examInfo.tags || []).length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.625, mt: 1.25 }}>
              {examInfo.tags.map((tag) => (
                <Box key={tag} sx={{ backgroundColor: 'rgba(10,132,255,0.12)', border: '0.5px solid rgba(10,132,255,0.2)', borderRadius: '20px', px: 1, py: 0.25 }}>
                  <Typography sx={{ fontSize: '0.6875rem', color: '#0A84FF', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{tag}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Requirements */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5, fontFamily: 'Inter, sans-serif' }}>
          Requirements
        </Typography>
        <Stack spacing={1}>
          <RequirementRow icon={IconMaximize} label="Fullscreen Mode" met={isFullscreen} onAction={!isFullscreen ? retryFullscreen : undefined} actionLabel="Enable" />
          <RequirementRow icon={IconCamera} label="Camera Access" met={!!cameraStream} onAction={!cameraStream ? requestCameraAccess : undefined} actionLabel="Allow" />
          <RequirementRow
            icon={IconDeviceDesktop}
            label={
              detectionMethod
                ? `Screen Monitoring Active (${detectionMethod})`
                : isSupported
                  ? 'Screen Monitoring Active'
                  : 'Screen Monitoring (limited support — Chrome 100+ recommended)'
            }
            met={true}
          />
          <RequirementRow icon={IconAlertCircle} label="Agreement Certified" met={certify} />

          {/* External display check */}
          <Box sx={{
            p: 1.5, borderRadius: '10px',
            backgroundColor: isExternalDisplayDetected ? 'rgba(255,69,58,0.1)' : 'rgba(48,209,88,0.08)',
            border: `0.5px solid ${isExternalDisplayDetected ? 'rgba(255,69,58,0.35)' : 'rgba(48,209,88,0.2)'}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: isExternalDisplayDetected ? 'rgba(255,69,58,0.15)' : 'rgba(48,209,88,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconDeviceDesktop size={14} color={isExternalDisplayDetected ? '#FF453A' : '#30D158'} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.875rem', color: isExternalDisplayDetected ? '#FF453A' : '#FFFFFF', fontFamily: 'Inter, sans-serif', fontWeight: isExternalDisplayDetected ? 600 : 400 }}>
                    {isExternalDisplayDetected
                      ? `External display detected (${screenCount} screens)`
                      : 'Single display confirmed'}
                  </Typography>
                  {isExternalDisplayDetected && detectedScreens.length > 0 && (
                    <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {detectedScreens.map((s, i) => {
                        const Icon = s.connectionType === 'Wireless' ? IconWifi
                          : s.connectionType === 'Bluetooth' ? IconBluetooth
                          : s.connectionType === 'USB-C' ? IconUsb
                          : IconDeviceDesktop;
                        return (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, backgroundColor: 'rgba(255,69,58,0.12)', borderRadius: '6px', px: 0.75, py: 0.2 }}>
                            <Icon size={10} color="#FF453A" />
                            <Typography sx={{ fontSize: '0.625rem', color: '#FF453A', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                              {s.isPrimary ? 'Primary' : s.connectionType} {s.width ? `${s.width}×${s.height}` : ''}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  {isExternalDisplayDetected && (
                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,69,58,0.8)', fontFamily: 'Inter, sans-serif', mt: 0.5 }}>
                      Disconnect all external displays to continue
                    </Typography>
                  )}
                  {'getScreenDetails' in window && !hasPermission && (
                    <Button
                      size="small"
                      onClick={async () => {
                        try {
                          await window.getScreenDetails();
                          toast.success('Enhanced display monitoring enabled');
                        } catch {
                          toast.error('Permission denied — basic monitoring still active');
                        }
                      }}
                      sx={{ mt: 0.5, color: '#0A84FF', textTransform: 'none', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', p: 0, minWidth: 0, '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
                    >
                      Enable Enhanced Detection
                    </Button>
                  )}
                </Box>
              </Box>
              {isExternalDisplayDetected
                ? <IconX size={16} color="#FF453A" />
                : <IconCheck size={16} color="#30D158" />}
            </Box>
          </Box>
          {/* AI model loading row */}
          <Box sx={{ p: 1.5, borderRadius: '10px', backgroundColor: aiReady ? 'rgba(48,209,88,0.08)' : aiModelStatus === 'error' ? 'rgba(255,159,10,0.08)' : 'rgba(255,255,255,0.04)', border: `0.5px solid ${aiReady ? 'rgba(48,209,88,0.2)' : aiModelStatus === 'error' ? 'rgba(255,159,10,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: aiModelStatus === 'loading' ? 1 : 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '7px', backgroundColor: aiReady ? 'rgba(48,209,88,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconBrain size={14} color={aiReady ? '#30D158' : 'rgba(235,235,245,0.4)'} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.875rem', color: aiReady ? '#FFFFFF' : 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif', fontWeight: aiReady ? 500 : 400 }}>
                    AI Proctoring Engine
                  </Typography>
                  {aiModelStatus === 'loading' && (
                    <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(235,235,245,0.4)', fontFamily: 'Inter, sans-serif' }}>
                      Downloading models… {aiProgress}%
                    </Typography>
                  )}
                  {aiModelStatus === 'error' && (
                    <Box>
                      <Typography sx={{ fontSize: '0.6875rem', color: '#FF9F0A', fontFamily: 'Inter, sans-serif' }}>
                        Model unavailable — basic monitoring active.{' '}
                        <Box component="span"
                          onClick={retryLoadModels}
                          sx={{ color: '#0A84FF', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Retry
                        </Box>
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              {aiReady ? <IconCheck size={16} color="#30D158" /> : <IconX size={16} color="rgba(235,235,245,0.3)" />}
            </Box>
            {aiModelStatus === 'loading' && (
              <LinearProgress variant="determinate" value={aiProgress}
                sx={{ borderRadius: 2, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', '& .MuiLinearProgress-bar': { backgroundColor: '#0A84FF', borderRadius: 2 } }} />
            )}
          </Box>
        </Stack>
      </Box>

      {/* Camera preview */}
      {cameraStream && (
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5, fontFamily: 'Inter, sans-serif' }}>
            Camera Preview
          </Typography>
          <Box sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', maxWidth: 280 }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block' }} />
            <Chip label="LIVE" size="small" sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#FF453A', color: '#fff', fontWeight: 700, fontSize: '0.625rem', letterSpacing: '0.05em', height: 20 }} />
          </Box>
        </Box>
      )}

      {cameraError && (
        <Box sx={{ backgroundColor: 'rgba(255,69,58,0.1)', border: '0.5px solid rgba(255,69,58,0.25)', borderRadius: '10px', p: 1.5, mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '0.8125rem', color: '#FF453A', fontFamily: 'Inter, sans-serif' }}>Camera access failed</Typography>
          <Button size="small" onClick={requestCameraAccess} sx={{ color: '#0A84FF', textTransform: 'none', fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', minWidth: 0 }}>Retry</Button>
        </Box>
      )}

      {/* Instructions */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5, fontFamily: 'Inter, sans-serif' }}>
          Instructions
        </Typography>
        <Box sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', p: 2 }}>
          <Stack spacing={1.25}>
            {instructions.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#0A84FF', fontFamily: 'Inter, sans-serif', fontWeight: 600, minWidth: 18, mt: 0.1 }}>
                  {i + 1}.
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.65)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Confirmation + Start */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 600, color: 'rgba(235,235,245,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase', mb: 1.5, fontFamily: 'Inter, sans-serif' }}>
          Confirmation
        </Typography>
        <Box sx={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', p: 2, mb: 2 }}>
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(235,235,245,0.6)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, mb: 1.5 }}>
            Your actions will be proctored by AI. Any signs of academic dishonesty may result in suspension or cancellation of your test.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={certify}
                onChange={() => setCertify(!certify)}
                sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#0A84FF' }, p: 1 }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.875rem', color: 'rgba(235,235,245,0.8)', fontFamily: 'Inter, sans-serif' }}>
                I have read and agree to all instructions above
              </Typography>
            }
          />
        </Box>
        <Button
          variant="contained"
          disabled={!canStartTest}
          onClick={handleTest}
          fullWidth
          sx={{
            backgroundColor: canStartTest ? '#0A84FF' : 'rgba(255,255,255,0.06)',
            color: canStartTest ? '#fff' : 'rgba(235,235,245,0.25)',
            borderRadius: '14px',
            py: 1.5,
            fontSize: '0.9375rem',
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            textTransform: 'none',
            boxShadow: canStartTest ? '0 4px 16px rgba(10,132,255,0.35)' : 'none',
            '&:hover': { backgroundColor: canStartTest ? '#409CFF' : 'rgba(255,255,255,0.06)' },
            '&:disabled': { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(235,235,245,0.25)' },
          }}
        >
          Start Exam
        </Button>
        {!canStartTest && (
          <Typography sx={{ fontSize: '0.75rem', color: isExternalDisplayDetected ? '#FF453A' : 'rgba(235,235,245,0.3)', fontFamily: 'Inter, sans-serif', textAlign: 'center', mt: 1, fontWeight: isExternalDisplayDetected ? 600 : 400 }}>
            {isExternalDisplayDetected
              ? '🖥️ Disconnect external display to start the exam'
              : 'Complete all requirements above to start'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default function ExamDetails() {
  const { examId } = useParams();
  const { data: examsData } = useGetExamsQuery();
  const examInfo = examsData?.find((e) => e.examId === examId);

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#000000' }}>
      {/* Left panel — branding/visual */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A84FF 0%, #5E5CE6 50%, #BF5AF2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)' }} />
        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: 4 }}>
          <Box sx={{ width: 80, height: 80, borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Typography sx={{ fontWeight: 800, color: '#fff', fontSize: '1.5rem', fontFamily: 'Inter, sans-serif' }}>AP</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '2rem', color: '#FFFFFF', letterSpacing: '-0.04em', fontFamily: 'Inter, sans-serif', mb: 0.5 }}>
            {examInfo?.examName || 'ATE-PROT'}
          </Typography>
          {examInfo?.subject && (
            <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', mb: 1 }}>
              {examInfo.subject}
            </Typography>
          )}
          <Typography sx={{ fontSize: '0.9375rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
            AI-Powered Exam Proctoring
          </Typography>
          {examInfo && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: `${examInfo.duration} min`, sub: 'Duration' },
                { label: `${examInfo.totalQuestions}`, sub: 'Questions' },
                { label: `${examInfo.passingScore || 60}%`, sub: 'Pass Mark' },
              ].map(({ label, sub }) => (
                <Box key={sub} sx={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '12px', px: 2, py: 1.25, minWidth: 72 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: '#FFFFFF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.03em' }}>{label}</Typography>
                  <Typography sx={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.25 }}>{sub}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', top: -100, left: -100 }} />
        <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', bottom: -50, right: -50 }} />
      </Box>

      {/* Right panel — instructions */}
      <Box sx={{ width: { xs: '100%', md: 480 }, backgroundColor: '#111111', overflowY: 'auto' }}>
        <DescriptionAndInstructions />
      </Box>
    </Box>
  );
}
