import { useEffect, useRef } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

/**
 * Custom hook for eye gaze tracking
 * Detects when user looks away from the screen
 */
export const useEyeGazeTracking = ({
  enabled = false,
  onGazeViolation = () => {},
  detectionInterval = 1000,
  gazeThreshold = 0.15,
  webcamRef = null,
}) => {
  const detectorRef = useRef(null);
  const intervalRef = useRef(null);
  const lastViolationTimeRef = useRef(0);
  const isInitializedRef = useRef(false);
  const violationCountRef = useRef(0);
  // Store latest values in refs so the detection loop always reads fresh values
  // without needing to be recreated (which would cause the infinite re-render loop)
  const onGazeViolationRef = useRef(onGazeViolation);
  const gazeThresholdRef = useRef(gazeThreshold);
  const webcamRefRef = useRef(webcamRef);

  useEffect(() => { onGazeViolationRef.current = onGazeViolation; }, [onGazeViolation]);
  useEffect(() => { gazeThresholdRef.current = gazeThreshold; }, [gazeThreshold]);
  useEffect(() => { webcamRefRef.current = webcamRef; }, [webcamRef]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const initAndStart = async () => {
      // Only initialize once
      if (!isInitializedRef.current) {
        try {
          console.log('🔄 Initializing Eye Gaze Tracker...');
          const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
          detectorRef.current = await faceLandmarksDetection.createDetector(model, {
            runtime: 'tfjs',
            refineLandmarks: true,
            maxFaces: 1,
          });
          isInitializedRef.current = true;
          console.log('✅ Eye Gaze Tracker Initialized');
        } catch (error) {
          console.error('❌ Failed to initialize Eye Gaze Tracker:', error);
          return;
        }
      }

      if (cancelled) return;

      // Start detection loop
      if (intervalRef.current) return; // already running
      console.log('▶️ Starting gaze detection loop');

      intervalRef.current = setInterval(async () => {
        const wRef = webcamRefRef.current;
        if (!detectorRef.current || !wRef?.current?.video) return;

        const video = wRef.current.video;
        if (video.readyState !== 4 || video.videoWidth === 0 || video.videoHeight === 0) return;

        try {
          const faces = await detectorRef.current.estimateFaces(video);
          if (faces.length === 0) return;

          const keypoints = faces[0].keypoints;
          const threshold = gazeThresholdRef.current;

          // Core landmarks
          const noseTip = keypoints[4];
          const leftEyeOuter = keypoints[33];
          const leftEyeInner = keypoints[133];
          const rightEyeInner = keypoints[362];
          const rightEyeOuter = keypoints[263];
          const forehead = keypoints[10];
          const chin = keypoints[152];

          if (!noseTip || !leftEyeOuter || !rightEyeOuter) return;

          let horizontalOffset = 0;

          // Try iris landmarks first (available with refineLandmarks: true)
          const leftIris = keypoints[468];
          const rightIris = keypoints[473];

          if (leftIris && rightIris && leftEyeInner && rightEyeInner) {
            const leftEyeWidth = leftEyeOuter.x - leftEyeInner.x;
            const rightEyeWidth = rightEyeInner.x - rightEyeOuter.x;

            if (Math.abs(leftEyeWidth) > 1 && Math.abs(rightEyeWidth) > 1) {
              const leftIrisRatio = (leftIris.x - leftEyeInner.x) / leftEyeWidth;
              const rightIrisRatio = (rightIris.x - rightEyeOuter.x) / rightEyeWidth;
              const avgIrisRatio = (leftIrisRatio + rightIrisRatio) / 2;
              horizontalOffset = avgIrisRatio - 0.5;
            }
          }

          // Fallback: head-pose using eye-span asymmetry
          if (!horizontalOffset && leftEyeInner && rightEyeInner) {
            const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
            const rightEyeWidth = Math.abs(rightEyeInner.x - rightEyeOuter.x);
            const totalWidth = leftEyeWidth + rightEyeWidth;

            if (totalWidth > 2) {
              horizontalOffset = leftEyeWidth / totalWidth - 0.5;
            }
          }

          // Vertical: nose offset from face vertical midpoint
          let verticalOffset = 0;
          if (forehead && chin) {
            const faceMidY = (forehead.y + chin.y) / 2;
            const faceHeight = Math.abs(chin.y - forehead.y);
            if (faceHeight > 0) verticalOffset = (noseTip.y - faceMidY) / faceHeight;
          }

          const isLookingAway =
            Math.abs(horizontalOffset) > threshold ||
            Math.abs(verticalOffset) > threshold;

          if (isLookingAway) {
            const now = Date.now();
            if (now - lastViolationTimeRef.current >= 5000) {
              lastViolationTimeRef.current = now;
              violationCountRef.current += 1;

              const direction = {
                horizontal: horizontalOffset > threshold ? 'right' : horizontalOffset < -threshold ? 'left' : 'center',
                vertical: verticalOffset > threshold ? 'down' : verticalOffset < -threshold ? 'up' : 'center',
              };

              console.log('👀 Gaze Violation Detected:', {
                direction,
                gazeX: horizontalOffset.toFixed(2),
                gazeY: verticalOffset.toFixed(2),
                count: violationCountRef.current,
              });

              onGazeViolationRef.current({
                direction,
                gazeX: horizontalOffset,
                gazeY: verticalOffset,
                timestamp: now,
              });
            }
          }
        } catch (error) {
          console.error('Error detecting gaze:', error);
        }
      }, detectionInterval);
    };

    initAndStart();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        console.log('⏹️ Stopping gaze detection loop');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [enabled, detectionInterval]); // Only re-run when enabled/interval changes

  return {
    isInitialized: isInitializedRef.current,
    violationCount: violationCountRef.current,
  };
};

export default useEyeGazeTracking;
