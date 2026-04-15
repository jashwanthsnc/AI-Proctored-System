import { useEffect, useRef } from 'react';

/**
 * Monitors microphone audio level during exams.
 * Triggers onNoiseDetected when sustained audio exceeds the threshold.
 *
 * @param {Object} options
 * @param {boolean} options.enabled
 * @param {number}  options.noiseThreshold  0-255, default 40 (low = very sensitive)
 * @param {number}  options.sustainedMs     How long noise must persist before flagging (ms)
 * @param {number}  options.cooldownMs      Min gap between consecutive violations (ms)
 * @param {Function} options.onNoiseDetected Callback({ level, timestamp })
 */
const useAudioMonitoring = ({
  enabled = false,
  noiseThreshold = 40,
  sustainedMs = 2000,
  cooldownMs = 15000,
  onNoiseDetected = null,
} = {}) => {
  const streamRef = useRef(null);
  const contextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const noiseStartRef = useRef(null);
  const lastViolationRef = useRef(0);
  const onNoiseRef = useRef(onNoiseDetected);
  const thresholdRef = useRef(noiseThreshold);
  const sustainedRef = useRef(sustainedMs);
  const cooldownRef = useRef(cooldownMs);

  useEffect(() => { onNoiseRef.current = onNoiseDetected; }, [onNoiseDetected]);
  useEffect(() => { thresholdRef.current = noiseThreshold; }, [noiseThreshold]);
  useEffect(() => { sustainedRef.current = sustainedMs; }, [sustainedMs]);
  useEffect(() => { cooldownRef.current = cooldownMs; }, [cooldownMs]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        contextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.fftSize);

        const tick = () => {
          if (cancelled) return;
          analyser.getByteTimeDomainData(dataArray);

          // RMS amplitude (0-128 mapped)
          let sumSq = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const v = (dataArray[i] - 128) / 128;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / dataArray.length);
          const level = Math.round(rms * 255);

          const now = Date.now();
          if (level > thresholdRef.current) {
            if (!noiseStartRef.current) noiseStartRef.current = now;
            const duration = now - noiseStartRef.current;
            if (duration >= sustainedRef.current && (now - lastViolationRef.current) >= cooldownRef.current) {
              lastViolationRef.current = now;
              noiseStartRef.current = null;
              if (onNoiseRef.current) onNoiseRef.current({ level, timestamp: new Date().toISOString() });
            }
          } else {
            noiseStartRef.current = null;
          }

          animFrameRef.current = requestAnimationFrame(tick);
        };

        tick();
      } catch {
        // Microphone permission denied — silently skip audio monitoring
      }
    };

    start();

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (contextRef.current) contextRef.current.close().catch(() => {});
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, [enabled]);

  return null;
};

export default useAudioMonitoring;
