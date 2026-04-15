import { useEffect, useRef } from 'react';
import { getModels, areModelsReady, onModelStatusChange } from '../utils/modelSingleton';

const useEyeGazeTracking = ({
  enabled = false,
  webcamRef = null,
  gazeThreshold = 0.18,
  detectionInterval = 1200,
  cooldownMs = 5000,
  onGazeViolation = null,
} = {}) => {
  const intervalRef        = useRef(null);
  const lastViolation      = useRef(0);
  const violationCount     = useRef(0);
  const unsubRef           = useRef(null);
  const consecutiveAwayRef = useRef(0);

  const onGazeRef    = useRef(onGazeViolation);
  const thresholdRef = useRef(gazeThreshold);
  const cooldownRef  = useRef(cooldownMs);
  const webcamRefRef = useRef(webcamRef);

  useEffect(() => { onGazeRef.current = onGazeViolation; }, [onGazeViolation]);
  useEffect(() => { thresholdRef.current = gazeThreshold; }, [gazeThreshold]);
  useEffect(() => { cooldownRef.current = cooldownMs; }, [cooldownMs]);
  useEffect(() => { webcamRefRef.current = webcamRef; }, [webcamRef]);

  const getAdaptiveCooldown = () => {
    const count = violationCount.current;
    if (count >= 10) return 2000;
    if (count >= 5)  return 3000;
    return cooldownRef.current;
  };

  const startLoop = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      const { face } = getModels();
      if (!face) return;
      const wRef = webcamRefRef.current;
      if (!wRef?.current?.video) return;
      const video = wRef.current.video;
      if (video.readyState !== 4 || !video.videoWidth) return;

      try {
        const faces = await face.estimateFaces(video);
        if (!faces?.length) return;

        const kps = faces[0].keypoints;
        if (!kps || kps.length < 6) return;

        const rightEye = kps[0];
        const leftEye  = kps[1];
        const noseTip  = kps[2];
        const rightEar = kps[4];
        const leftEar  = kps[5];

        if (!rightEye || !leftEye || !noseTip) return;

        const eyeMidX = (rightEye.x + leftEye.x) / 2;
        const eyeMidY = (rightEye.y + leftEye.y) / 2;
        const eyeSpan = Math.abs(leftEye.x - rightEye.x);

        if (eyeSpan < 8) {
          consecutiveAwayRef.current = 0;
          return;
        }

        const hOffset = (noseTip.x - eyeMidX) / eyeSpan;
        const vOffset = (noseTip.y - eyeMidY) / eyeSpan;
        const thresh  = thresholdRef.current;

        let gazeAway = Math.abs(hOffset) > thresh || Math.abs(vOffset) > thresh;

        if (!gazeAway && rightEar && leftEar) {
          const leftDist  = Math.abs(leftEar.x - noseTip.x);
          const rightDist = Math.abs(rightEar.x - noseTip.x);
          if (rightDist > 0) {
            const earRatio = leftDist / rightDist;
            if (earRatio > 2.5 || earRatio < 0.4) gazeAway = true;
          }
        }

        if (gazeAway) {
          consecutiveAwayRef.current += 1;
        } else {
          consecutiveAwayRef.current = 0;
          return;
        }

        if (consecutiveAwayRef.current < 3) return;

        const now = Date.now();
        const adaptiveCooldown = getAdaptiveCooldown();
        if (now - lastViolation.current < adaptiveCooldown) return;

        lastViolation.current = now;
        violationCount.current += 1;
        consecutiveAwayRef.current = 0;

        const absH = Math.abs(hOffset);
        const absV = Math.abs(vOffset);
        const maxDeviation = Math.max(absH / thresh, absV / thresh);
        let severity;
        if (maxDeviation >= 2.5) severity = 'severe';
        else if (maxDeviation >= 1.5) severity = 'moderate';
        else severity = 'mild';

        const direction = {
          horizontal: hOffset >  thresh ? 'right' : hOffset < -thresh ? 'left'   : 'center',
          vertical:   vOffset >  thresh ? 'down'  : vOffset < -thresh ? 'up'     : 'center',
        };

        onGazeRef.current?.({
          direction,
          gazeX: hOffset,
          gazeY: vOffset,
          severity,
          timestamp: now,
        });
      } catch {}
    }, detectionInterval);
  };

  useEffect(() => {
    if (!enabled) return;

    // Clear any existing interval so a changed detectionInterval takes effect immediately
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    if (areModelsReady()) {
      startLoop();
    } else {
      unsubRef.current = onModelStatusChange((s) => {
        if (s === 'ready') startLoop();
      });
    }

    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    };
  }, [enabled, detectionInterval]);

  return { violationCount: violationCount.current };
};

export default useEyeGazeTracking;
