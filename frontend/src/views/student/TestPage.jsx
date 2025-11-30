import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Divider
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
  IconAlertCircle
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSaveResultMutation } from 'src/slices/resultApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import useBrowserLockdown from 'src/hooks/useBrowserLockdown';
import WebCam from './Components/WebCam';
import axiosInstance from '../../axios';

const TestPage = () => {
  const { examId, testId } = useParams();
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDurationInSeconds, setExamDurationInSeconds] = useState(0);
  const { data: userExamdata, isLoading: isExamsLoading } = useGetExamsQuery();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog, resetCheatingLog, markScreenshotsAsSaved, getUnsavedScreenshots } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [saveResult] = useSaveResultMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for improved UI
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState(new Map());
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  // Throttle toast notifications to prevent spam
  const lastNotificationTime = useRef({
    violation: 0,
    tabSwitch: 0,
    windowBlur: 0,
  });

  const NOTIFICATION_THROTTLE_MS = 5000; // Show notification at most once every 5 seconds

  const showThrottledNotification = (type, message, toastType) => {
    const now = Date.now();
    if (now - lastNotificationTime.current[type] > NOTIFICATION_THROTTLE_MS) {
      lastNotificationTime.current[type] = now;
      if (toastType === 'error') {
        toast.error(message);
      } else if (toastType === 'warning') {
        toast.warning(message);
      }
    }
  };

  // Browser lockdown for exam security
  const { violationCount, tabSwitchCount, isFullscreen, exitFullscreen } = useBrowserLockdown({
    enabled: true,
    enforceFullscreen: true,
    onViolation: (violation) => {
      console.log('🚨 Browser Lockdown Violation:', violation);
      updateCheatingLog({ browserLockdownViolations: (cheatingLog.browserLockdownViolations || 0) + 1 });
      showThrottledNotification('violation', 'Security violation detected!', 'error');
    },
    onTabSwitch: (event) => {
      console.log('⚠️ Tab switch detected:', event);
      updateCheatingLog({ tabSwitchViolations: (cheatingLog.tabSwitchViolations || 0) + 1 });
      showThrottledNotification('tabSwitch', 'Tab switch detected!', 'warning');
    },
    onWindowBlur: (event) => {
      console.log('⚠️ Window blur detected:', event);
      updateCheatingLog({ windowBlurViolations: (cheatingLog.windowBlurViolations || 0) + 1 });
      showThrottledNotification('windowBlur', 'Window focus lost!', 'warning');
    },
  });

  // Save initial cheating log when exam starts
  useEffect(() => {
    if (!examId || !userInfo) return;

    const saveInitialLog = async () => {
      try {
        const initialLog = {
          examId,
          email: userInfo.email,
          username: userInfo.name,
          noFaceCount: 0,
          multipleFaceCount: 0,
          cellPhoneCount: 0,
          prohibitedObjectCount: 0,
          screenshots: [],
          browserLockdownViolations: 0,
          tabSwitchViolations: 0,
          windowBlurViolations: 0,
        };

        await saveCheatingLogMutation(initialLog).unwrap();
        console.log('✅ Initial log saved - Student now visible in Live Proctoring');
      } catch (error) {
        console.error('❌ Error saving initial log:', error);
      }
    };

    saveInitialLog();
  }, [examId, userInfo, saveCheatingLogMutation]);

  // Auto-save cheating log every 30 seconds
  useEffect(() => {
    if (!examId || !userInfo) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        const unsavedScreenshots = getUnsavedScreenshots();
        
        const logData = {
          examId,
          email: userInfo.email,
          username: userInfo.name,
          noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
          multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
          cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
          prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
          screenshots: unsavedScreenshots,
          browserLockdownViolations: cheatingLog.browserLockdownViolations || 0,
          tabSwitchViolations: cheatingLog.tabSwitchViolations || 0,
          windowBlurViolations: cheatingLog.windowBlurViolations || 0,
        };

        await saveCheatingLogMutation(logData).unwrap();
        markScreenshotsAsSaved(unsavedScreenshots);
        
        console.log('🔄 Auto-saved - Student still visible');
      } catch (error) {
        console.error('Error auto-saving cheating log:', error);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [examId, userInfo, cheatingLog, saveCheatingLogMutation, getUnsavedScreenshots, markScreenshotsAsSaved]);

  const { data: questions, isLoading, isError, error } = useGetQuestionsQuery(examId);

  // Set exam duration and initialize timer
  useEffect(() => {
    if (userExamdata) {
      const exam = userExamdata.find((exam) => exam.examId === examId);
      if (exam) {
        setSelectedExam(exam);
        const durationInSeconds = exam.duration * 60;
        setExamDurationInSeconds(exam.duration);
        setTimeLeft(durationInSeconds);
        console.log('Exam duration (minutes):', exam.duration);
      }
    }
  }, [userExamdata, examId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on time remaining
  const getTimerColor = () => {
    const percentage = (timeLeft / (examDurationInSeconds * 60)) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  // Get question status
  const getQuestionStatus = (index) => {
    if (!visitedQuestions.has(index)) return 'not-visited';
    if (markedForReview.has(index)) return 'review';
    if (answers.has(questions[index]?._id)) return 'answered';
    return 'not-answered';
  };

  // Handle question navigation
  const handleQuestionChange = (index) => {
    setCurrentQuestion(index);
    setVisitedQuestions(prev => new Set([...prev, index]));
    
    // Load saved answer if exists
    const questionId = questions[index]?._id;
    if (questionId && answers.has(questionId)) {
      setSelectedOption(answers.get(questionId));
    } else {
      setSelectedOption(null);
    }
  };

  // Handle option selection
  const handleOptionChange = (optionId) => {
    setSelectedOption(optionId);
    const questionId = questions[currentQuestion]?._id;
    if (questionId) {
      setAnswers(prev => {
        const newAnswers = new Map(prev);
        newAnswers.set(questionId, optionId);
        return newAnswers;
      });
    }
  };

  // Handle mark for review
  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
        toast.info('Question unmarked for review');
      } else {
        newSet.add(currentQuestion);
        toast.info('Question marked for review');
      }
      return newSet;
    });
  };

  // Handle next question
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      handleQuestionChange(currentQuestion + 1);
    }
  };

  // Handle previous question
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      handleQuestionChange(currentQuestion - 1);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) return; // Ignore ctrl/cmd shortcuts
      
      if (e.key === 'ArrowRight' && currentQuestion < questions?.length - 1) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, questions]);

  // Auto submit when time is up
  const handleAutoSubmit = () => {
    toast.warning('Time is up! Submitting your test...');
    handleSubmit();
  };

  // Handle test submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    const unansweredCount = questions.length - answers.size;
    
    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    try {
      setIsSubmitting(true);

      // Save results
      const answersObject = Object.fromEntries(answers);
      await axiosInstance.post(
        '/api/users/results',
        {
          examId,
          answers: answersObject,
        },
        {
          withCredentials: true,
        },
      );

      // Save final cheating log
      const finalLog = {
        examId,
        email: userInfo.email,
        username: userInfo.name,
        noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
        multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
        cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
        prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
        screenshots: getUnsavedScreenshots(),
        browserLockdownViolations: cheatingLog.browserLockdownViolations || 0,
        tabSwitchViolations: cheatingLog.tabSwitchViolations || 0,
        windowBlurViolations: cheatingLog.windowBlurViolations || 0,
      };

      await saveCheatingLogMutation(finalLog).unwrap();

      toast.success('Test submitted successfully!');
      
      // Check if there are coding questions
      navigate(`/exam/${examId}/codedetails`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isExamsLoading || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (isError) {
    const errorMessage = error?.data?.message || 'Failed to load exam questions';
    const isNotAuthorized = error?.status === 403;

    return (
      <PageContainer title="TestPage" description="Error loading test">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Alert 
            severity="error" 
            sx={{ maxWidth: 600 }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/exam')}>
                Back to Exams
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              {isNotAuthorized ? 'Access Denied' : 'Error Loading Test'}
            </Typography>
            <Typography variant="body2">
              {isNotAuthorized 
                ? 'You are not authorized to take this exam. Please contact your teacher.'
                : errorMessage
              }
            </Typography>
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <PageContainer title="TestPage" description="No questions available">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <Alert 
            severity="warning" 
            sx={{ maxWidth: 600 }}
            action={
              <Button color="inherit" size="small" onClick={() => navigate('/exam')}>
                Back to Exams
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              No Questions Available
            </Typography>
            <Typography variant="body2">
              This exam doesn't have any questions yet. Please contact your teacher.
            </Typography>
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <PageContainer title="TestPage" description="Online Examination">
      <Box sx={{ height: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header with Timer and Progress */}
        <Paper elevation={2} sx={{ p: 2, borderRadius: 0, flexShrink: 0 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2}>
              <Typography variant="h6" fontWeight={600}>
                {selectedExam?.examName || 'Exam'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Question {currentQuestion + 1} of {questions.length}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Box>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  color={getTimerColor()}
                />
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Chip 
                    label={`Answered: ${answers.size}`} 
                    color="success" 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Not Answered: ${visitedQuestions.size - answers.size}`} 
                    color="error" 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Marked: ${markedForReview.size}`} 
                    color="warning" 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={`Not Visited: ${questions.length - visitedQuestions.size}`} 
                    color="default" 
                    size="small" 
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={2}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                }}
              >
                <Paper 
                  elevation={3}
                  sx={{ 
                    px: 2.5, 
                    py: 1.5, 
                    borderRadius: 3,
                    background: getTimerColor() === 'error' 
                      ? 'linear-gradient(135deg, #ff5252 0%, #f44336 100%)'
                      : getTimerColor() === 'warning'
                      ? 'linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)'
                      : 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
                    color: 'white',
                    boxShadow: getTimerColor() === 'error'
                      ? '0 4px 20px rgba(255, 82, 82, 0.4)'
                      : getTimerColor() === 'warning'
                      ? '0 4px 20px rgba(255, 167, 38, 0.4)'
                      : '0 4px 20px rgba(102, 187, 106, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: getTimerColor() === 'error'
                        ? '0 6px 24px rgba(255, 82, 82, 0.5)'
                        : getTimerColor() === 'warning'
                        ? '0 6px 24px rgba(255, 167, 38, 0.5)'
                        : '0 6px 24px rgba(102, 187, 106, 0.5)',
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={44}
                      thickness={3}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.2)',
                        position: 'absolute',
                      }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={(timeLeft / (examDurationInSeconds * 60)) * 100}
                      size={44}
                      thickness={3}
                      sx={{
                        color: 'white',
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        },
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconClock size={20} color="white" />
                    </Box>
                  </Box>
                  <Box>
                    <Typography 
                      variant="h5" 
                      fontWeight={700}
                      sx={{ 
                        lineHeight: 1,
                        letterSpacing: '0.5px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {formatTime(timeLeft)}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.95,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        letterSpacing: '0.3px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Time Left
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box textAlign="right">
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  startIcon={<IconSend />}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  sx={{ px: 4, py: 1.5 }}
                  fullWidth
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Test'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Content Area */}
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Question Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Question Content */}
            <Box sx={{ flex: 1, overflow: 'hidden', p: 3, display: 'flex', flexDirection: 'column' }}>
              <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Question Header */}
                <Box mb={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h5" fontWeight={600} color="primary">
                      Question {currentQuestion + 1}
                    </Typography>
                    <Tooltip title={markedForReview.has(currentQuestion) ? "Unmark for review" : "Mark for review"}>
                      <IconButton 
                        onClick={toggleMarkForReview}
                        color={markedForReview.has(currentQuestion) ? "warning" : "default"}
                      >
                        {markedForReview.has(currentQuestion) ? (
                          <IconFlagFilled size={24} />
                        ) : (
                          <IconFlag size={24} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                  <Divider />
                </Box>

                {/* Question Text */}
                <Box mb={4}>
                  <Typography 
                    variant="body1" 
                    fontSize="1.1rem"
                    lineHeight={1.8}
                    dangerouslySetInnerHTML={{ __html: currentQuestionData?.question }}
                  />
                </Box>

                {/* Options */}
                <Stack spacing={2}>
                  {currentQuestionData?.options?.map((option, index) => (
                    <Paper
                      key={option._id}
                      elevation={selectedOption === option._id ? 3 : 1}
                      sx={{
                        p: 2.5,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selectedOption === option._id ? 'primary.main' : 'divider',
                        bgcolor: selectedOption === option._id ? 'primary.lighter' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateX(8px)',
                        }
                      }}
                      onClick={() => handleOptionChange(option._id)}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: selectedOption === option._id ? 'primary.main' : 'divider',
                            bgcolor: selectedOption === option._id ? 'primary.main' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            color: selectedOption === option._id ? 'white' : 'text.primary',
                            flexShrink: 0
                          }}
                        >
                          {String.fromCharCode(65 + index)}
                        </Box>
                        <Typography 
                          variant="body1"
                          sx={{ 
                            fontWeight: selectedOption === option._id ? 600 : 400,
                            color: selectedOption === option._id ? 'primary.main' : 'text.primary'
                          }}
                        >
                          {option.optionText}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Box>

            {/* Navigation Footer */}
            <Paper elevation={3} sx={{ p: 2, borderRadius: 0, flexShrink: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  startIcon={<IconChevronLeft />}
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  size="large"
                  sx={{ minWidth: 150 }}
                >
                  Previous
                </Button>

                <Button
                  variant="outlined"
                  color="warning"
                  onClick={toggleMarkForReview}
                  startIcon={markedForReview.has(currentQuestion) ? <IconFlagFilled /> : <IconFlag />}
                  size="large"
                  sx={{ minWidth: 200 }}
                >
                  {markedForReview.has(currentQuestion) ? 'Unmark for Review' : 'Mark for Review'}
                </Button>
                
                <Button
                  variant="contained"
                  endIcon={<IconChevronRight />}
                  onClick={handleNext}
                  disabled={currentQuestion === questions.length - 1}
                  size="large"
                  sx={{ minWidth: 150 }}
                >
                  Next
                </Button>
              </Stack>
            </Paper>
          </Box>

          {/* Right Sidebar */}
          <Collapse orientation="horizontal" in={sidebarOpen} collapsedSize={0}>
            <Paper 
              elevation={3} 
              sx={{ 
                width: 320, 
                display: 'flex', 
                flexDirection: 'column',
                borderLeft: '1px solid',
                borderColor: 'divider',
                borderRadius: 0
              }}
            >
              {/* Webcam */}
              <Box sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5} display="flex" alignItems="center">
                  <IconAlertCircle size={18} style={{ marginRight: 6 }} />
                  AI Proctoring
                </Typography>
                <Paper elevation={2} sx={{ overflow: 'hidden', borderRadius: 2 }}>
                  <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} />
                </Paper>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Your exam is being monitored for security
                </Typography>
              </Box>

              <Divider />

              {/* Question Palette */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={2}>
                  Question Palette
                </Typography>
                
                <Grid container spacing={1}>
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    let bgcolor = 'background.paper';
                    let borderColor = 'divider';
                    let textColor = 'text.primary';

                    if (status === 'answered') {
                      bgcolor = 'success.lighter';
                      borderColor = 'success.main';
                      textColor = 'success.dark';
                    } else if (status === 'review') {
                      bgcolor = 'warning.lighter';
                      borderColor = 'warning.main';
                      textColor = 'warning.dark';
                    } else if (status === 'not-answered') {
                      bgcolor = 'error.lighter';
                      borderColor = 'error.main';
                      textColor = 'error.dark';
                    }

                    return (
                      <Grid item xs={3} key={index}>
                        <Tooltip title={`Question ${index + 1} - ${status.replace('-', ' ')}`}>
                          <Paper
                            elevation={currentQuestion === index ? 4 : 1}
                            sx={{
                              aspectRatio: '1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              border: '2px solid',
                              borderColor: currentQuestion === index ? 'primary.main' : borderColor,
                              bgcolor: currentQuestion === index ? 'primary.main' : bgcolor,
                              color: currentQuestion === index ? 'white' : textColor,
                              fontWeight: 600,
                              transition: 'all 0.2s',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                zIndex: 1
                              }
                            }}
                            onClick={() => handleQuestionChange(index)}
                          >
                            {index + 1}
                          </Paper>
                        </Tooltip>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Legend */}
                <Box mt={3}>
                  <Typography variant="caption" fontWeight={600} display="block" mb={1}>
                    Legend
                  </Typography>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 20, height: 20, bgcolor: 'success.lighter', border: '2px solid', borderColor: 'success.main', borderRadius: 0.5 }} />
                      <Typography variant="caption">Answered</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 20, height: 20, bgcolor: 'error.lighter', border: '2px solid', borderColor: 'error.main', borderRadius: 0.5 }} />
                      <Typography variant="caption">Not Answered</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 20, height: 20, bgcolor: 'warning.lighter', border: '2px solid', borderColor: 'warning.main', borderRadius: 0.5 }} />
                      <Typography variant="caption">Marked for Review</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 20, height: 20, bgcolor: 'background.paper', border: '2px solid', borderColor: 'divider', borderRadius: 0.5 }} />
                      <Typography variant="caption">Not Visited</Typography>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            </Paper>
          </Collapse>

          {/* Sidebar Toggle Button */}
          <Box
            sx={{
              position: 'fixed',
              right: sidebarOpen ? 320 : 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 1000,
              transition: 'right 0.3s'
            }}
          >
            <IconButton
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: '8px 0 0 8px',
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              {sidebarOpen ? <IconLayoutSidebarLeftCollapse /> : <IconLayoutSidebarLeftExpand />}
            </IconButton>
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default TestPage;
