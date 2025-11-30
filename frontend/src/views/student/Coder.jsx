import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import axiosInstance from '../../axios';
import Webcam from '../student/Components/WebCam';
import {
  Button,
  Box,
  Grid,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  IconButton,
  Collapse,
  Stack,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import { 
  ExpandMore, 
  CheckCircle, 
  Cancel, 
  PlayArrow,
} from '@mui/icons-material';
import {
  IconClock,
  IconLayoutSidebarRightCollapse,
  IconLayoutSidebarRightExpand,
  IconSend,
  IconAlertCircle,
  IconTerminal,
  IconTestPipe,
  IconCode,
  IconFlag,
  IconAward,
  IconFileCode,
} from '@tabler/icons-react';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSaveResultMutation } from 'src/slices/resultApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router';
import { useCheatingLog } from 'src/context/CheatingLogContext';
import useBrowserLockdown from 'src/hooks/useBrowserLockdown';

// Tab Panel Component
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ height: '100%', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}>
      {value === index && children}
    </div>
  );
}

export default function Coder() {
  const [code, setCode] = useState('// Write your code here...');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [questionId, setQuestionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [question, setQuestion] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState(0);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const { examId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { cheatingLog, updateCheatingLog, markScreenshotsAsSaved, getUnsavedScreenshots } = useCheatingLog();
  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [saveResult] = useSaveResultMutation();

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

  useEffect(() => {
    if (userInfo) {
      updateCheatingLog((prevLog) => ({
        ...prevLog,
        username: userInfo.name,
        email: userInfo.email,
      }));
    }
  }, [userInfo]);

  useEffect(() => {
    if (examId && cheatingLog.examId !== examId) {
      console.log('🔧 [Coder] Setting examId in context:', examId);
      updateCheatingLog({ examId });
    }
  }, [examId, cheatingLog.examId, updateCheatingLog]);

  // Save initial cheating log
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
        console.log('✅ Initial log saved (Coder) - Student now visible');
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
        console.log('🔄 Auto-saved (Coder) - Student still visible');
      } catch (error) {
        console.error('Error auto-saving cheating log:', error);
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [examId, userInfo, cheatingLog, saveCheatingLogMutation, getUnsavedScreenshots, markScreenshotsAsSaved]);

  // Fetch coding question when component mounts
  useEffect(() => {
    const fetchCodingQuestion = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 [Coder] Fetching coding question for examId:', examId);

        const response = await axiosInstance.get(`/api/coding/questions/exam/${examId}`, {
          withCredentials: true,
        });

        console.log('📦 [Coder] API Response:', response.data);

        if (response.data.success && response.data.data) {
          const questionData = Array.isArray(response.data.data) 
            ? response.data.data[0] 
            : response.data.data;
          
          console.log('✅ [Coder] Question loaded successfully:', {
            id: questionData?._id,
            title: questionData?.title,
            difficulty: questionData?.difficulty,
          });

          if (questionData && questionData._id) {
            setQuestionId(questionData._id);
            setQuestion(questionData);

            // Set timer from question time limit
            if (questionData.timeLimit) {
              setTimeLeft(questionData.timeLimit * 60); // Convert to seconds
            }

            if (questionData.description) {
              setCode(`// ${questionData.description}\n\n// Write your code here...`);
            }
          } else {
            console.error('❌ [Coder] No valid question data found');
            toast.error('No coding question found for this exam. Please contact your teacher.');
          }
        } else {
          console.error('❌ [Coder] Invalid response format:', response.data);
          toast.error('No coding question found for this exam. Please contact your teacher.');
        }
      } catch (error) {
        console.error('❌ [Coder] Error fetching coding question:', error);

        if (error?.response?.status === 403) {
          toast.error('Access denied. You are not assigned to this exam.');
        } else if (error?.response?.status === 404) {
          toast.error('No coding question found for this exam.');
        } else {
          toast.error(error?.response?.data?.message || 'Failed to load coding question');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (examId) {
      fetchCodingQuestion();
    } else {
      console.error('❌ [Coder] No examId provided');
      toast.error('Invalid exam ID');
      setIsLoading(false);
    }
  }, [examId]);

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

  // Get timer color
  const getTimerColor = () => {
    if (!question?.timeLimit) return 'primary';
    const percentage = (timeLeft / (question.timeLimit * 60)) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  const handleAutoSubmit = () => {
    toast.warning('Time is up! Submitting your code...');
    handleSubmit();
  };

  const runCode = async () => {
    let apiUrl;
    switch (language) {
      case 'python':
        apiUrl = '/run-python';
        break;
      case 'java':
        apiUrl = '/run-java';
        break;
      case 'javascript':
        apiUrl = '/run-javascript';
        break;
      default:
        return;
    }

    setIsRunningCode(true);
    setConsoleTab(0); // Switch to Output tab

    try {
      const response = await axiosInstance.post(apiUrl, { code }, { withCredentials: true });
      console.log('API Response:', response.data);
      setOutput(response.data);
      toast.success('Code executed successfully!');
    } catch (error) {
      console.error('Error running code:', error);
      setOutput('Error running code: ' + (error.response?.data?.message || error.message));
      toast.error('Failed to execute code');
    } finally {
      setIsRunningCode(false);
    }
  };

  const runTestCases = async () => {
    if (!question?.testCases || question.testCases.length === 0) {
      toast.info('No test cases available for this question');
      return;
    }

    const sampleTestCases = question.testCases.filter(tc => tc.isSample);
    
    if (sampleTestCases.length === 0) {
      toast.info('No sample test cases available to run');
      return;
    }

    setIsRunningTests(true);
    setConsoleTab(1); // Switch to Test Results tab
    const results = [];

    let apiUrl;
    switch (language) {
      case 'python':
        apiUrl = '/run-python';
        break;
      case 'java':
        apiUrl = '/run-java';
        break;
      case 'javascript':
        apiUrl = '/run-javascript';
        break;
      default:
        setIsRunningTests(false);
        return;
    }

    try {
      for (let i = 0; i < sampleTestCases.length; i++) {
        const testCase = sampleTestCases[i];
        const codeWithInput = `${code}\n\n// Test Input:\nconsole.log(${testCase.input})`;
        
        try {
          const response = await axiosInstance.post(
            apiUrl, 
            { code: codeWithInput }, 
            { withCredentials: true }
          );
          
          const output = response.data.trim();
          const expected = testCase.expectedOutput.trim();
          const passed = output === expected;
          
          results.push({
            testCase: i + 1,
            input: testCase.input,
            expected: expected,
            actual: output,
            passed: passed,
            points: testCase.points || 10
          });
        } catch (error) {
          results.push({
            testCase: i + 1,
            input: testCase.input,
            expected: testCase.expectedOutput,
            actual: 'Error: ' + (error.message || 'Execution failed'),
            passed: false,
            points: 0
          });
        }
      }
      
      setTestResults(results);
      const passedCount = results.filter(r => r.passed).length;
      const totalPoints = results.filter(r => r.passed).reduce((sum, r) => sum + r.points, 0);
      
      toast.success(
        `Test Results: ${passedCount}/${results.length} passed (${totalPoints} points)`,
        { autoClose: 3000 }
      );
    } catch (error) {
      console.error('Error running test cases:', error);
      toast.error('Failed to run test cases');
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleSubmit = async () => {
    const confirmSubmit = window.confirm(
      'Are you sure you want to submit your code? This action cannot be undone.'
    );
    
    if (!confirmSubmit) return;

    try {
      console.log('📤 [Coder] Submitting code...');

      const response = await axiosInstance.post(
        '/api/coding/submit',
        {
          questionId: questionId,
          code,
          language,
          examId,
        },
        { withCredentials: true },
      );

      console.log('✅ [Coder] Response:', response.data);

      if (response.data.success) {
        console.log('✅ Code submitted successfully');

        try {
          await saveResult({
            examId,
            answers: {},
          }).unwrap();
          console.log('✅ Result saved - Student marked as submitted');
        } catch (resultError) {
          console.error('❌ Error saving result:', resultError);
        }

        try {
          const unsavedScreenshots = getUnsavedScreenshots();
          const finalLog = {
            examId: examId,
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

          await saveCheatingLogMutation(finalLog).unwrap();
          console.log('✅ Cheating log saved successfully');
        } catch (cheatingLogError) {
          console.error('Error saving cheating log:', cheatingLogError);
        }

        toast.success('Test submitted successfully!');
        navigate('/success');
      } else {
        console.error('Submission failed:', response.data);
        toast.error('Failed to submit code');
      }
    } catch (error) {
      console.error('Error during submission:', error.response?.data || error);
      toast.error(
        error?.response?.data?.message || error?.data?.message || 'Failed to submit test',
      );
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!question) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Alert severity="warning" sx={{ maxWidth: 600 }}>
          <Typography variant="h6" gutterBottom>
            No Coding Question Available
          </Typography>
          <Typography variant="body2">
            No coding question found for this exam. Please contact your teacher.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const sampleTestCases = question?.testCases?.filter(tc => tc.isSample) || [];
  const passedTests = testResults.filter(r => r.passed).length;
  const totalPoints = testResults.filter(r => r.passed).reduce((sum, r) => sum + r.points, 0);

  return (
    <Box sx={{ height: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 0.75, borderRadius: 0, zIndex: 10, flexShrink: 0 }}>
        <Grid container spacing={1} alignItems="center">
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={2} alignItems="center">
              <IconFileCode size={28} color="#5D87FF" />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {question.question || 'Coding Challenge'}
                </Typography>
                <Stack direction="row" spacing={1} mt={0.5}>
                  <Chip 
                    label={question.difficulty || 'medium'} 
                    color={
                      question.difficulty === 'easy' ? 'success' :
                      question.difficulty === 'medium' ? 'warning' : 'error'
                    }
                    size="small"
                  />
                  <Chip 
                    icon={<IconAward size={16} />}
                    label={`${question.points || 100} points`} 
                    color="primary" 
                    size="small" 
                  />
                </Stack>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                label="Language"
                onChange={(e) => setLanguage(e.target.value)}
              >
                <MenuItem value="javascript">JavaScript</MenuItem>
                <MenuItem value="python">Python</MenuItem>
                <MenuItem value="java">Java</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                alignItems: 'center',
                gap: 1.5 
              }}
            >
              {timeLeft > 0 && (
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
                      value={(timeLeft / (question.timeLimit * 60)) * 100}
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
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box textAlign="right">
              <Button
                variant="contained"
                color="error"
                startIcon={<IconSend />}
                onClick={handleSubmit}
                fullWidth
                sx={{ py: 1 }}
              >
                Submit Code
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Code Editor Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          {/* Editor */}
          <Box sx={{ flex: '1 1 0', minHeight: 0, maxHeight: 'calc(100vh - 500px)', position: 'relative' }}>
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value)}
              theme="vs-dark"
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                bracketPairColorization: { enabled: true },
                contextmenu: false, // Disable right-click context menu
              }}
              onMount={(editor, monaco) => {
                // Override Monaco's clipboard actions to block copy/paste/cut
                editor.addAction({
                  id: 'block-copy',
                  label: 'Copy (Blocked)',
                  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC],
                  run: () => {
                    console.log('🚨 Copy blocked in editor');
                    return null;
                  }
                });
                
                editor.addAction({
                  id: 'block-cut',
                  label: 'Cut (Blocked)',
                  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX],
                  run: () => {
                    console.log('🚨 Cut blocked in editor');
                    return null;
                  }
                });
                
                editor.addAction({
                  id: 'block-paste',
                  label: 'Paste (Blocked)',
                  keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
                  run: () => {
                    console.log('🚨 Paste blocked in editor');
                    return null;
                  }
                });

                // Also block clipboard operations at DOM level
                const editorDomNode = editor.getDomNode();
                if (editorDomNode) {
                  editorDomNode.addEventListener('copy', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚨 Copy blocked at DOM level');
                  });
                  editorDomNode.addEventListener('cut', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚨 Cut blocked at DOM level');
                  });
                  editorDomNode.addEventListener('paste', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚨 Paste blocked at DOM level');
                  });
                }
              }}
            />
          </Box>

          {/* Action Buttons */}
          <Paper elevation={3} sx={{ p: 0.5, borderRadius: 0, flexShrink: 0 }}>
            <Stack direction="row" spacing={2} justifyContent="flex-start" alignItems="center">
              <Button 
                variant="outlined"
                startIcon={<IconCode />}
                onClick={runCode}
                disabled={isRunningCode}
                size="medium"
              >
                {isRunningCode ? 'Running...' : 'Run Code'}
              </Button>
              <Button
                variant="outlined"
                color="success"
                onClick={runTestCases}
                disabled={isRunningTests || sampleTestCases.length === 0}
                startIcon={<PlayArrow />}
                size="medium"
              >
                {isRunningTests ? 'Testing...' : 'Run Tests'}
              </Button>
            </Stack>
          </Paper>

          {/* Console Area */}
          <Paper elevation={3} sx={{ flex: '0 0 330px', borderRadius: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Tabs value={consoleTab} onChange={(e, v) => setConsoleTab(v)}>
                <Tab 
                  icon={<IconTerminal size={18} />} 
                  iconPosition="start" 
                  label="Output" 
                />
                <Tab 
                  icon={<IconTestPipe size={18} />} 
                  iconPosition="start" 
                  label={`Test Results ${testResults.length > 0 ? `(${passedTests}/${testResults.length})` : ''}`}
                />
              </Tabs>
            </Box>

            <TabPanel value={consoleTab} index={0}>
              <Box sx={{ p: 1, flex: 1, overflowY: 'auto' }}>
                {isRunningCode ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography>Executing code...</Typography>
                  </Box>
                ) : (
                  <Box sx={{ fontFamily: 'monospace', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                    {output || 'Run your code to see output here...'}
                  </Box>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={consoleTab} index={1}>
              <Box sx={{ p: 1, flex: 1, overflowY: 'auto' }}>
                {isRunningTests ? (
                  <Box display="flex" alignItems="center" gap={2}>
                    <CircularProgress size={20} />
                    <Typography>Running test cases...</Typography>
                  </Box>
                ) : testResults.length > 0 ? (
                  <Stack spacing={1}>
                    <Alert severity={passedTests === testResults.length ? "success" : "warning"} icon={false}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          {passedTests}/{testResults.length} Tests Passed
                        </Typography>
                        <Chip label={`${totalPoints} points`} size="small" color="primary" />
                      </Stack>
                    </Alert>
                    {testResults.map((result, idx) => (
                      <Paper key={idx} sx={{ p: 1, bgcolor: result.passed ? 'success.lighter' : 'error.lighter' }}>
                        <Stack direction="row" spacing={1} alignItems="center" width="100%">
                          {result.passed ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Cancel color="error" fontSize="small" />
                          )}
                          <Typography variant="body2" fontWeight={600}>
                            Test Case #{result.testCase}
                          </Typography>
                          <Chip
                            icon={result.passed ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                            label={result.passed ? 'Passed' : 'Failed'}
                            color={result.passed ? 'success' : 'error'}
                            size="small"
                          />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary">
                    Run test cases to see results here...
                  </Typography>
                )}
              </Box>
            </TabPanel>
          </Paper>
        </Box>

        {/* Right Sidebar */}
        <Collapse orientation="horizontal" in={sidebarOpen} collapsedSize={0} sx={{ height: '100%' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              width: 380, 
              height: '100%',
              display: 'flex', 
              flexDirection: 'column',
              borderLeft: '1px solid',
              borderColor: 'divider',
              borderRadius: 0,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={sidebarTab} onChange={(e, v) => setSidebarTab(v)}>
                <Tab 
                  icon={<IconFlag size={18} />} 
                  iconPosition="start" 
                  label="Problem" 
                />
                <Tab 
                  icon={<IconAlertCircle size={18} />} 
                  iconPosition="start" 
                  label="AI Proctoring" 
                />
              </Tabs>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <TabPanel value={sidebarTab} index={0}>
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, p: 2, gap: 2, minHeight: 0 }}>
                  {/* Question Header Card */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 2.5,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      position: 'relative',
                      overflow: 'hidden',
                      flexShrink: 0,
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '150px',
                        height: '150px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        transform: 'translate(50%, -50%)',
                      }
                    }}
                  >
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconFlag size={24} />
                        <Typography variant="h6" fontWeight={700}>
                          Problem Statement
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1.5} flexWrap="wrap">
                        <Chip 
                          label={question.difficulty || 'medium'} 
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                            color: 'white',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            textTransform: 'uppercase',
                            fontSize: '0.7rem',
                            letterSpacing: '0.5px',
                          }}
                        />
                        <Chip 
                          icon={<IconAward size={14} style={{ color: 'white' }} />}
                          label={`${question.points || 100} points`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                            color: 'white',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '& .MuiChip-icon': {
                              color: 'white',
                            }
                          }}
                        />
                        <Chip 
                          icon={<IconClock size={14} style={{ color: 'white' }} />}
                          label={`${question.timeLimit || 30} minutes`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255, 255, 255, 0.25)',
                            color: 'white',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '& .MuiChip-icon': {
                              color: 'white',
                            }
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>

                  {/* Description Content */}
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3,
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      flex: 1,
                      overflowY: 'auto',
                      minHeight: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        whiteSpace: 'pre-line',
                        lineHeight: 1.8,
                        color: 'text.primary',
                        fontSize: '0.95rem',
                      }}
                    >
                      {question.description || 'No description provided.'}
                    </Typography>
                  </Paper>

                  {/* Sample Test Cases */}
                  {sampleTestCases.length > 0 && (
                    <Box sx={{ flexShrink: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <IconTestPipe size={22} color="#5D87FF" />
                        <Typography variant="h6" fontWeight={700}>
                          Sample Test Cases
                        </Typography>
                      </Box>
                      <Alert 
                        severity="info" 
                        sx={{ 
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            fontSize: '1.2rem',
                          }
                        }}
                      >
                        Your code will be evaluated against both sample and hidden test cases.
                      </Alert>
                      
                      <Stack spacing={1}>
                        {sampleTestCases.map((testCase, index) => (
                          <Accordion key={index} sx={{ boxShadow: 1 }}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Stack direction="row" spacing={1} alignItems="center" width="100%">
                                <Typography variant="body2" fontWeight={600}>
                                  Test #{index + 1}
                                </Typography>
                                {testResults[index] && (
                                  <Chip
                                    icon={testResults[index].passed ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                                    label={testResults[index].passed ? 'Passed' : 'Failed'}
                                    color={testResults[index].passed ? 'success' : 'error'}
                                    size="small"
                                  />
                                )}
                              </Stack>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Stack spacing={1}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Input:
                                  </Typography>
                                  <Paper sx={{ p: 1, bgcolor: 'grey.100', mt: 0.5 }}>
                                    <pre style={{ margin: 0, fontSize: '0.75rem' }}>{testCase.input}</pre>
                                  </Paper>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                    Expected Output:
                                  </Typography>
                                  <Paper sx={{ p: 1, bgcolor: 'grey.100', mt: 0.5 }}>
                                    <pre style={{ margin: 0, fontSize: '0.75rem' }}>{testCase.expectedOutput}</pre>
                                  </Paper>
                                </Box>
                                {testResults[index] && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                      Your Output:
                                    </Typography>
                                    <Paper sx={{ 
                                      p: 1, 
                                      bgcolor: testResults[index].passed ? 'success.lighter' : 'error.lighter',
                                      mt: 0.5 
                                    }}>
                                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>{testResults[index].actual}</pre>
                                    </Paper>
                                  </Box>
                                )}
                              </Stack>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={sidebarTab} index={1}>
                <Box sx={{ overflowY: 'auto', flex: 1 }}>
                  {/* Webcam */}
                  <Box sx={{ p: 1, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" fontWeight={600} mb={1.5} display="flex" alignItems="center">
                      <IconAlertCircle size={18} style={{ marginRight: 6 }} />
                      AI Proctoring
                    </Typography>
                    <Paper elevation={2} sx={{ overflow: 'hidden', borderRadius: 2 }}>
                      <Webcam
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                        cheatingLog={cheatingLog}
                        updateCheatingLog={updateCheatingLog}
                      />
                    </Paper>
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Your exam is being monitored for security
                    </Typography>
                  </Box>
                </Box>
              </TabPanel>
            </Box>

            <Divider />
          </Paper>
        </Collapse>

        {/* Sidebar Toggle Button */}
        <Box
          sx={{
            position: 'fixed',
            right: sidebarOpen ? 380 : 0,
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
            {sidebarOpen ? <IconLayoutSidebarRightCollapse /> : <IconLayoutSidebarRightExpand />}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
