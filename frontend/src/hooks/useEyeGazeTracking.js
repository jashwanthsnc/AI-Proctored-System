import { useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

/**
 * Custom hook for eye gaze tracking
 * Detects when user looks away from the screen
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Enable/disable gaze tracking
 * @param {Function} options.onGazeViolation - Callback when gaze violation detected
 * @param {number} options.detectionInterval - Detection interval in ms (default: 1000)
 * @param {number} options.gazeThreshold - Threshold for gaze deviation (default: 0.3)
 * @param {Object} options.webcamRef - React ref to the webcam video element
 * 
 * @returns {Object} - Gaze tracking state and controls
 */
export const useEyeGazeTracking = ({
  enabled = false,
  onGazeViolation = () => {},
  detectionInterval = 1000,
  gazeThreshold = 0.3,
  webcamRef = null,
}) => {
  const detectorRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const lastViolationTimeRef = useRef(0);
  const isInitializedRef = useRef(false);
  const violationCountRef = useRef(0);

  // Initialize the face landmarks detector
  const initializeDetector = useCallback(async () => {
    if (isInitializedRef.current || !enabled) {
      return;
    }

    try {
      console.log('🔄 Initializing Eye Gaze Tracker...');
      
      // Load the MediaPipe FaceMesh model
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true, // Get iris landmarks for better gaze detection
        maxFaces: 1,
      };

      detectorRef.current = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );

      isInitializedRef.current = true;
      console.log('✅ Eye Gaze Tracker Initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Eye Gaze Tracker:', error);
    }
  }, [enabled]);

  // Calculate gaze direction from facial landmarks
  const calculateGazeDirection = useCallback((keypoints) => {
    try {
      // Get eye landmarks (iris keypoints)
      // Left eye iris: indices 468-472
      // Right eye iris: indices 473-477
      const leftIris = keypoints.slice(468, 473);
      const rightIris = keypoints.slice(473, 478);

      // Get eye corners for reference
      // Left eye outer corner: 33, inner corner: 133
      // Right eye outer corner: 362, inner corner: 263
      const leftEyeOuter = keypoints[33];
      const leftEyeInner = keypoints[133];
      const rightEyeOuter = keypoints[362];
      const rightEyeInner = keypoints[263];

      if (!leftIris.length || !rightIris.length) {
        return null;
      }

      // Calculate iris center for both eyes
      const leftIrisCenter = {
        x: leftIris.reduce((sum, p) => sum + p.x, 0) / leftIris.length,
        y: leftIris.reduce((sum, p) => sum + p.y, 0) / leftIris.length,
      };

      const rightIrisCenter = {
        x: rightIris.reduce((sum, p) => sum + p.x, 0) / rightIris.length,
        y: rightIris.reduce((sum, p) => sum + p.y, 0) / rightIris.length,
      };

      // Calculate eye width for normalization
      const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
      const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);

      // Calculate eye center
      const leftEyeCenter = {
        x: (leftEyeOuter.x + leftEyeInner.x) / 2,
        y: (leftEyeOuter.y + leftEyeInner.y) / 2,
      };

      const rightEyeCenter = {
        x: (rightEyeOuter.x + rightEyeInner.x) / 2,
        y: (rightEyeOuter.y + rightEyeInner.y) / 2,
      };

      // Calculate normalized gaze offset (how far iris is from center)
      const leftGazeX = (leftIrisCenter.x - leftEyeCenter.x) / leftEyeWidth;
      const rightGazeX = (rightIrisCenter.x - rightEyeCenter.x) / rightEyeWidth;

      // Average the gaze direction from both eyes
      const avgGazeX = (leftGazeX + rightGazeX) / 2;

      // Vertical gaze (up/down)
      const leftEyeHeight = Math.abs(keypoints[159].y - keypoints[145].y); // Top and bottom of left eye
      const rightEyeHeight = Math.abs(keypoints[386].y - keypoints[374].y); // Top and bottom of right eye

      const leftGazeY = (leftIrisCenter.y - leftEyeCenter.y) / leftEyeHeight;
      const rightGazeY = (rightIrisCenter.y - rightEyeCenter.y) / rightEyeHeight;

      const avgGazeY = (leftGazeY + rightGazeY) / 2;

      return {
        x: avgGazeX,
        y: avgGazeY,
        isLookingAway: Math.abs(avgGazeX) > gazeThreshold || Math.abs(avgGazeY) > gazeThreshold,
        direction: {
          horizontal: avgGazeX > gazeThreshold ? 'right' : avgGazeX < -gazeThreshold ? 'left' : 'center',
          vertical: avgGazeY > gazeThreshold ? 'down' : avgGazeY < -gazeThreshold ? 'up' : 'center',
        },
      };
    } catch (error) {
      console.error('Error calculating gaze direction:', error);
      return null;
    }
  }, [gazeThreshold]);

  // Detect gaze direction from video
  const detectGaze = useCallback(async () => {
    if (!detectorRef.current || !webcamRef?.current?.video || !enabled) {
      return;
    }

    const video = webcamRef.current.video;

    // Check if video is ready
    if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    try {
      const faces = await detectorRef.current.estimateFaces(video, {
        flipHorizontal: true,  // Match mirrored webcam display
      });

      if (faces.length === 0) {
        // No face detected - handled by existing face detection
        return;
      }

      const face = faces[0];
      const keypoints = face.keypoints;

      const gazeInfo = calculateGazeDirection(keypoints);

      if (gazeInfo && gazeInfo.isLookingAway) {
        const now = Date.now();
        
        // Rate limit violations: Only trigger once every 5 seconds
        if (now - lastViolationTimeRef.current >= 5000) {
          lastViolationTimeRef.current = now;
          violationCountRef.current += 1;

          console.log('👀 Gaze Violation Detected:', {
            direction: gazeInfo.direction,
            gazeX: gazeInfo.x.toFixed(2),
            gazeY: gazeInfo.y.toFixed(2),
            count: violationCountRef.current,
          });

          onGazeViolation({
            direction: gazeInfo.direction,
            gazeX: gazeInfo.x,
            gazeY: gazeInfo.y,
            timestamp: now,
          });
        }
      }
    } catch (error) {
      console.error('Error detecting gaze:', error);
    }
  }, [enabled, webcamRef, calculateGazeDirection, onGazeViolation]);

  // Start detection loop
  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      return;
    }

    console.log('▶️ Starting gaze detection loop');
    detectionIntervalRef.current = setInterval(() => {
      detectGaze();
    }, detectionInterval);
  }, [detectGaze, detectionInterval]);

  // Stop detection loop
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      console.log('⏹️ Stopping gaze detection loop');
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Initialize when enabled
  useEffect(() => {
    if (enabled && webcamRef?.current) {
      initializeDetector().then(() => {
        if (isInitializedRef.current) {
          startDetection();
        }
      });
    }

    return () => {
      stopDetection();
    };
  }, [enabled, webcamRef, initializeDetector, startDetection, stopDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [stopDetection]);

  return {
    isInitialized: isInitializedRef.current,
    violationCount: violationCountRef.current,
    startDetection,
    stopDetection,
  };
};

export default useEyeGazeTracking;
