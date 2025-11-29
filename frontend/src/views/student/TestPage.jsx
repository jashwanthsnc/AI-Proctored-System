import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Grid, CircularProgress, Alert, Button, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import MultipleChoiceQuestion from './Components/MultipleChoiceQuestion';
import NumberOfQuestions from './Components/NumberOfQuestions';
import WebCam from './Components/WebCam';
import { useGetExamsQuery, useGetQuestionsQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSaveResultMutation } from 'src/slices/resultApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useCheatingLog } from 'src/context/CheatingLogContext';

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
  const [isMcqCompleted, setIsMcqCompleted] = useState(false);

  // Save initial cheating log when exam starts (for real-time monitoring)
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
        };

        await saveCheatingLogMutation(initialLog).unwrap();
        console.log('✅ Initial log saved - Student now visible in Live Proctoring');
      } catch (error) {
        console.error('❌ Error saving initial log:', error);
      }
    };

    saveInitialLog();
  }, [examId, userInfo, saveCheatingLogMutation]);

  // Auto-save cheating log every 30 seconds for real-time monitoring
  useEffect(() => {
    if (!examId || !userInfo) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        // Get only unsaved screenshots to prevent duplicates
        const unsavedScreenshots = getUnsavedScreenshots();
        
        // Prepare the log data with only new screenshots
        const logData = {
          examId,
          email: userInfo.email,
          username: userInfo.name,
          noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
          multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
          cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
          prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
          screenshots: unsavedScreenshots, // Only send unsaved screenshots
        };

        // Always save to keep student visible (updates timestamp)
        await saveCheatingLogMutation(logData).unwrap();
        
        // Mark these screenshots as saved to prevent duplicates
        markScreenshotsAsSaved(unsavedScreenshots);
        
        console.log('🔄 Auto-saved - Student still visible', {
          newScreenshots: unsavedScreenshots.length,
          violations: {
            noFace: logData.noFaceCount,
            multipleFace: logData.multipleFaceCount,
            cellPhone: logData.cellPhoneCount,
            prohibited: logData.prohibitedObjectCount,
          },
        });
      } catch (error) {
        console.error('Error auto-saving cheating log:', error);
      }
    }, 30000); // Auto-save every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(autoSaveInterval);
  }, [examId, userInfo, cheatingLog, saveCheatingLogMutation, getUnsavedScreenshots, markScreenshotsAsSaved]);

  useEffect(() => {
    if (userExamdata) {
      const exam = userExamdata.find((exam) => exam.examId === examId);
      if (exam) {
        setSelectedExam(exam);
        // Convert duration from minutes to seconds
        setExamDurationInSeconds(exam.duration);
        console.log('Exam duration (minutes):', exam.duration);
      }
    }
  }, [userExamdata, examId]);

  const [questions, setQuestions] = useState([]);
  const { data, isLoading, isError, error } = useGetQuestionsQuery(examId);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (data) {
      setQuestions(data);
    }
  }, [data]);

  const handleMcqCompletion = () => {
    setIsMcqCompleted(true);
    // Reset cheating log for coding exam
    resetCheatingLog(examId);
    navigate(`/exam/${examId}/codedetails`);
  };

  const handleTestSubmission = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);

      // IMPORTANT: Save empty result to mark exam as submitted
      // This ensures student is removed from active students list
      try {
        await saveResult({
          examId,
          answers: {}, // Empty answers - MCQ answers already saved when moving to coding section
        }).unwrap();
        console.log('✅ Result saved - Student marked as submitted');
      } catch (resultError) {
        console.error('❌ Error saving result:', resultError);
        // Continue even if result save fails - at least save the log
      }

      // Make sure we have the latest user info in the log
      const updatedLog = {
        ...cheatingLog,
        username: userInfo.name,
        email: userInfo.email,
        examId: examId,
        noFaceCount: parseInt(cheatingLog.noFaceCount) || 0,
        multipleFaceCount: parseInt(cheatingLog.multipleFaceCount) || 0,
        cellPhoneCount: parseInt(cheatingLog.cellPhoneCount) || 0,
        prohibitedObjectCount: parseInt(cheatingLog.prohibitedObjectCount) || 0,
      };

      console.log('Submitting cheating log:', updatedLog);

      // Save the cheating log
      const result = await saveCheatingLogMutation(updatedLog).unwrap();
      console.log('Cheating log saved:', result);

      toast.success('Test submitted successfully!');
      navigate('/Success');
    } catch (error) {
      console.error('Error saving cheating log:', error);
      toast.error(
        error?.data?.message || error?.message || 'Failed to save test logs. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveUserTestScore = () => {
    setScore(score + 1);
  };

  if (isExamsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Handle error state (unauthorized access or other errors)
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
                ? 'You are not authorized to take this exam. This exam has not been assigned to you. Please contact your teacher.'
                : errorMessage
              }
            </Typography>
          </Alert>
        </Box>
      </PageContainer>
    );
  }

  // Handle empty questions
  if (!isLoading && (!data || data.length === 0)) {
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

  return (
    <PageContainer title="TestPage" description="This is TestPage">
      <Box pt="3rem">
        <Grid container spacing={3}>
          <Grid item xs={12} md={7} lg={7}>
            <BlankCard>
              <Box
                width="100%"
                minHeight="400px"
                boxShadow={3}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
              >
                {isLoading ? (
                  <CircularProgress />
                ) : (
                  <MultipleChoiceQuestion
                    submitTest={isMcqCompleted ? handleTestSubmission : handleMcqCompletion}
                    questions={data}
                    saveUserTestScore={saveUserTestScore}
                  />
                )}
              </Box>
            </BlankCard>
          </Grid>
          <Grid item xs={12} md={5} lg={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    maxHeight="300px"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'start',
                      justifyContent: 'center',
                      overflowY: 'auto',
                      height: '100%',
                    }}
                  >
                    <NumberOfQuestions
                      questionLength={questions.length}
                      submitTest={isMcqCompleted ? handleTestSubmission : handleMcqCompletion}
                      examDurationInSeconds={examDurationInSeconds}
                    />
                  </Box>
                </BlankCard>
              </Grid>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    width="300px"
                    maxHeight="180px"
                    boxShadow={3}
                    display="flex"
                    flexDirection="column"
                    alignItems="start"
                    justifyContent="center"
                  >
                    <WebCam cheatingLog={cheatingLog} updateCheatingLog={updateCheatingLog} />
                  </Box>
                </BlankCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default TestPage;
