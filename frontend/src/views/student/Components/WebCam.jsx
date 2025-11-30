import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Card } from '@mui/material';
import { toast } from 'react-toastify';
import { UploadClient } from '@uploadcare/upload-client';

const client = new UploadClient({ publicKey: 'e69ab6e5db6d4a41760b' });

export default function Home({ cheatingLog, updateCheatingLog }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [lastDetectionTime, setLastDetectionTime] = useState({});
  const lastGlobalWarningTimeRef = useRef(0);  // Use ref for synchronous updates
  const [screenshots, setScreenshots] = useState([]);

  // Initialize screenshots array when component mounts
  useEffect(() => {
    if (cheatingLog && cheatingLog.screenshots) {
      setScreenshots(cheatingLog.screenshots);
    }
  }, [cheatingLog]);

  const captureScreenshotAndUpload = async (type) => {
    const video = webcamRef.current?.video;

    if (
      !video ||
      video.readyState !== 4 || // ensure video is ready
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      console.error('❌ [Screenshot] Video not ready:', {
        videoExists: !!video,
        readyState: video?.readyState,
        width: video?.videoWidth,
        height: video?.videoHeight
      });
      return null;
    }

    console.log(`📸 [${type}] Capturing screenshot...`);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    const file = dataURLtoFile(dataUrl, `cheating_${Date.now()}.jpg`);

    try {
      console.log(`📤 [${type}] Uploading to Uploadcare...`);
      const result = await client.uploadFile(file);
      console.log(`✅ [${type}] Uploaded to Uploadcare:`, result.cdnUrl);
      
      const screenshot = {
        url: result.cdnUrl,
        type: type,
        detectedAt: new Date()
      };

      // Update local screenshots state
      setScreenshots(prev => [...prev, screenshot]);
      
      return screenshot;
    } catch (error) {
      console.error(`❌ [${type}] Upload failed:`, error);
      return null;
    }
  };

  const handleDetection = async (type) => {
    const now = Date.now();
    const lastTime = lastDetectionTime[type] || 0;

    // Rate limit: Only trigger warning once every 30 seconds for the same violation type
    // Also enforce global cooldown: no more than 1 warning toast every 10 seconds (regardless of type)
    if (now - lastTime >= 30000 && now - lastGlobalWarningTimeRef.current >= 10000) {
      setLastDetectionTime((prev) => ({ ...prev, [type]: now }));
      lastGlobalWarningTimeRef.current = now;  // Update ref immediately (synchronous)
      
      console.log(`🚨 [${type}] Violation Detected!`);
      
      // Capture and upload screenshot (optional - don't block on failure)
      const screenshot = await captureScreenshotAndUpload(type);
      
      // Update count regardless of screenshot success
      console.log(`📝 [${type}] Updating violation count...`);
      
      // Use functional form to prevent stale closure issues
      updateCheatingLog((prevLog) => {
        const currentCount = prevLog[`${type}Count`] || 0;
        const newCount = currentCount + 1;
        
        console.log(`📊 [${type}] Count Update:`, {
          previous: currentCount,
          new: newCount,
          screenshotCaptured: !!screenshot,
          fullState: prevLog
        });
        
        const updatedLog = {
          ...prevLog,
          [`${type}Count`]: newCount,
          // Only add screenshot if upload succeeded
          screenshots: screenshot 
            ? [...(prevLog.screenshots || []), screenshot]
            : (prevLog.screenshots || [])
        };
        
        console.log(`✅ [${type}] Updated Log:`, updatedLog);
        return updatedLog;
      });

      switch (type) {
        case 'noFace':
          toast.warning('👤 Face Not Visible - Warning Recorded');
          break;
        case 'multipleFace':
          toast.warning('👥 Multiple Faces Detected - Warning Recorded');
          break;
        case 'cellPhone':
          toast.warning('📱 Cell Phone Detected - Warning Recorded');
          break;
        case 'prohibitedObject':
          toast.warning('📚 Prohibited Object Detected - Warning Recorded');
          break;
        default:
          break;
      }
    }
  };

  const runCoco = async () => {
    try {
      const net = await cocossd.load();
      console.log('AI model loaded.');
      setInterval(() => detect(net), 1000);
    } catch (error) {
      console.error('Error loading model:', error);
      toast.error('Error loading AI model. Please refresh the page.');
    }
  };

  const detect = async (net) => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        const obj = await net.detect(video);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawRect(obj, ctx);

        let person_count = 0;
        let faceDetected = false;

        obj.forEach((element) => {
          const detectedClass = element.class;
          console.log('Detected:', detectedClass);

          if (detectedClass === 'cell phone') handleDetection('cellPhone');
          if (detectedClass === 'book' || detectedClass === 'laptop')
            handleDetection('prohibitedObject');
          if (detectedClass === 'person') {
            faceDetected = true;
            person_count++;
            if (person_count > 1) handleDetection('multipleFace');
          }
        });

        if (!faceDetected) handleDetection('noFace');
      } catch (error) {
        console.error('Error during detection:', error);
      }
    }
  };

  useEffect(() => {
    runCoco();
  }, []);

  return (
    <Box>
      <Card variant="outlined" sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user',
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
          }}
        />
      </Card>
    </Box>
  );
}

// Helper to convert base64 to File
function dataURLtoFile(dataUrl, fileName) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}
