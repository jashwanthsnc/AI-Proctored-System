import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  List,
  ListItem,
  ListItemText,
  Radio,
  Stack,
  Typography,
  Paper,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'react-toastify';
import { IconCamera, IconMaximize, IconCheck, IconAlertCircle } from '@tabler/icons-react';

const CodeDetailsMore = () => {
  const [certify, setCertify] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { examId } = useParams();

  // Request camera access and fullscreen on component mount
  useEffect(() => {
    requestCameraAccess();
    
    // Request fullscreen
    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        console.error('Fullscreen request failed:', err);
        toast.warning('Please enable fullscreen for the test');
      }
    };

    requestFullscreen();

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      // Stop camera stream on unmount
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      setCameraStream(stream);
      setCameraError(null);
      toast.success('Camera access granted');
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(err.message);
      toast.error('Camera access denied. Please allow camera access to continue.');
    }
  };

  const handleCertifyChange = () => {
    setCertify(!certify);
  };

  const retryFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
      toast.error('Failed to enable fullscreen');
    }
  };

  function handleCodeTest() {
    if (!isFullscreen) {
      toast.error('Please enable fullscreen mode to start the test');
      return;
    }
    
    if (!cameraStream) {
      toast.error('Camera access is required to start the test');
      return;
    }

    navigate(`/exam/${examId}/code`);
  }

  const canStartTest = certify && isFullscreen && cameraStream;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {/* Permissions Status Banner */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: canStartTest ? 'success.lighter' : 'warning.lighter',
            border: '1px solid',
            borderColor: canStartTest ? 'success.main' : 'warning.main',
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconAlertCircle size={24} />
            Pre-Test Requirements
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" mt={1}>
            <Chip 
              icon={isFullscreen ? <IconCheck size={18} /> : <IconMaximize size={18} />}
              label="Fullscreen Mode"
              color={isFullscreen ? 'success' : 'warning'}
              variant={isFullscreen ? 'filled' : 'outlined'}
              onClick={!isFullscreen ? retryFullscreen : undefined}
              sx={{ cursor: !isFullscreen ? 'pointer' : 'default' }}
            />
            <Chip 
              icon={cameraStream ? <IconCheck size={18} /> : <IconCamera size={18} />}
              label="Camera Access"
              color={cameraStream ? 'success' : 'warning'}
              variant={cameraStream ? 'filled' : 'outlined'}
              onClick={!cameraStream ? requestCameraAccess : undefined}
              sx={{ cursor: !cameraStream ? 'pointer' : 'default' }}
            />
            <Chip 
              icon={certify ? <IconCheck size={18} /> : <IconAlertCircle size={18} />}
              label="Agreement Certified"
              color={certify ? 'success' : 'default'}
              variant={certify ? 'filled' : 'outlined'}
            />
          </Stack>
          {!canStartTest && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Please complete all requirements above before starting the test. Click on the chips to retry if needed.
            </Alert>
          )}
        </Paper>

        {/* Camera Preview */}
        {cameraStream && (
          <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Camera Preview
            </Typography>
            <Box sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '400px',
              margin: '0 auto',
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: 'black'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ 
                  width: '100%', 
                  display: 'block',
                  borderRadius: '8px'
                }}
              />
              <Chip 
                label="Live"
                color="error"
                size="small"
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  fontWeight: 600
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
              Your camera feed during the test. This is for proctoring purposes.
            </Typography>
          </Paper>
        )}

        {cameraError && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={requestCameraAccess}>
                Retry
              </Button>
            }
          >
            <Typography variant="subtitle2" gutterBottom>
              Camera Access Failed
            </Typography>
            <Typography variant="body2">
              {cameraError}
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h2" mb={3}>
          Description
        </Typography>
        <Typography>
          This practice test will allow you to measure your Python skills at the beginner level by
          the way of various multiple choice questions. We recommend you to score at least 75% in
          this test before moving to the next level questionnaire. It will help you in identifying
          your strength and development areas. Based on the same you can plan your next steps in
          learning Python and preparing for job placements.
        </Typography>

        <Typography>#Python #Coding #Software #MCQ #Beginner #Programming Language</Typography>

        <>
          <Typography variant="h3" mb={3} mt={3}>
            Test Instructions
          </Typography>
          <List>
            <ol>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    This Practice Test consists of only <strong>MCQ questions.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    There are a total of <strong>40 questions.</strong> Test Duration is{' '}
                    <strong>30 minutes.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    There is <strong>Negative Marking</strong> for wrong answers.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    <strong>Do Not switch tabs </strong> while taking the test.
                    <strong> Switching Tabs will Block / End the test automatically.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    The test will only run in <strong>full screen mode.</strong> Do not switch
                    back to tab mode. Test will end automatically.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    You may need to use blank sheets for rough work. Please arrange for blank
                    sheets before starting.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Clicking on Back or Next will save the answer.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Questions can be reattempted till the time test is running.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Click on the finish test once you are done with the test.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    You will be able to view the scores once your test is complete.
                  </Typography>
                </ListItemText>
              </li>
            </ol>
          </List>
        </>
        <Typography variant="h3" mb={3} mt={3}>
          Confirmation
        </Typography>
        <Typography mb={3}>
          Your actions shall be proctored and any signs of wrongdoing may lead to suspension or
          cancellation of your test.
        </Typography>
        <Stack direction="column" alignItems="center" spacing={3}>
          <FormControlLabel
            control={
              <Checkbox checked={certify} onChange={handleCertifyChange} color="primary" />
            }
            label="I certify that I have carefully read and agree to all of the instructions mentioned above"
          />
          <div style={{ display: 'flex', padding: '2px', margin: '10px' }}>
            <Button
              onClick={handleCodeTest}
              style={{ marginLeft: '21px' }}
              disabled={!canStartTest}
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4 }}
            >
              Coding test
            </Button>
          </div>
          {!canStartTest && (
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Complete all requirements above to enable the Coding Test button
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

const imgUrl =
  'https://cdn-api.elice.io/api-attachment/attachment/61bd920a02e1497b8f9fab92d566e103/image.jpeg';
export function CodeDetails() {
  return (
    <>
      <Grid container sx={{ height: '93vh' }}>
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            backgroundImage: `url(${imgUrl})`, // 'url(https://source.unsplash.com/random?wallpapers)',
            backgroundRepeat: 'no-repeat',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square sx={{ height: '100%', overflow: 'hidden' }}>
          <CodeDetailsMore />
        </Grid>
      </Grid>
    </>
  );
}

export default CodeDetails;
