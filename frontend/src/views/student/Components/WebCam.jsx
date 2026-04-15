import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import { toast } from 'react-toastify';
import { UploadClient } from '@uploadcare/upload-client';
import { loadModels, getModels, areModelsReady, onModelStatusChange } from '../../../utils/modelSingleton';

const client = new UploadClient({ publicKey: 'e69ab6e5db6d4a41760b' });
const PERIODIC_INTERVAL = 90000;

const PHONE_CLASSES      = new Set(['cell phone']);
const PROHIBITED_CLASSES = new Set(['laptop', 'book', 'backpack', 'mouse', 'remote', 'keyboard']);

export default function WebCamProctor({ cheatingLog, updateCheatingLog, webcamRef: externalRef }) {
  const internalRef  = useRef(null);
  const webcamRef    = externalRef || internalRef;
  const canvasRef    = useRef(null);
  const lastDetectionTime   = useRef({});
  const lastGlobalWarn      = useRef(0);
  const intervalRef         = useRef(null);
  const noFaceCounterRef    = useRef(0);
  const recentDetections    = useRef(new Map());
  const lastLowLightWarn    = useRef(0);
  const [modelStatus, setModelStatus]   = useState(() => areModelsReady() ? 'ready' : 'loading');
  const [loadProgress, setLoadProgress] = useState(areModelsReady() ? 100 : 0);

  // ── Rolling buffer helpers ────────────────────────────────────────────────
  const recordDetection = (type, detected) => {
    if (!recentDetections.current.has(type)) {
      recentDetections.current.set(type, [false, false, false]);
    }
    const buf = recentDetections.current.get(type);
    buf.shift();
    buf.push(detected);
  };

  const shouldFireViolation = (type) => {
    const buf = recentDetections.current.get(type);
    if (!buf) return false;
    const trueCount = buf.filter(Boolean).length;
    return trueCount >= 2;
  };

  // ── Screenshot upload ─────────────────────────────────────────────────────
  const captureAndUpload = async (type) => {
    const video = webcamRef.current?.video;
    if (!video || video.readyState !== 4 || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const file = dataURLtoFile(canvas.toDataURL('image/jpeg', 0.75), `proctor_${Date.now()}.jpg`);
    try {
      const result = await client.uploadFile(file);
      return { url: result.cdnUrl, type, detectedAt: new Date() };
    } catch { return null; }
  };

  // ── Violation handler ─────────────────────────────────────────────────────
  const handleViolation = async (type) => {
    const now = Date.now();
    if (now - (lastDetectionTime.current[type] || 0) < 30000) return;
    if (now - lastGlobalWarn.current < 8000) return;
    lastDetectionTime.current[type] = now;
    lastGlobalWarn.current = now;
    const screenshot = await captureAndUpload(type);
    updateCheatingLog((prev) => ({
      ...prev,
      [`${type}Count`]: (prev[`${type}Count`] || 0) + 1,
      screenshots: screenshot ? [...(prev.screenshots || []), screenshot] : (prev.screenshots || []),
    }));
    const msgs = {
      noFace:           'Face not visible — Warning recorded',
      multipleFace:     'Multiple faces detected',
      cellPhone:        'Phone detected — Warning recorded',
      prohibitedObject: 'Prohibited object detected',
    };
    if (msgs[type]) toast.warning(msgs[type], { autoClose: 4000 });
  };

  // ── Periodic screenshot ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      const shot = await captureAndUpload('periodic');
      if (shot) updateCheatingLog((prev) => ({ ...prev, screenshots: [...(prev.screenshots || []), shot] }));
    }, PERIODIC_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // ── Load models (singleton) ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = onModelStatusChange((s) => setModelStatus(s));

    if (areModelsReady()) {
      setModelStatus('ready'); setLoadProgress(100);
      startDetection();
    } else {
      loadModels((pct) => setLoadProgress(pct))
        .then(() => { setModelStatus('ready'); startDetection(); })
        .catch(() => { setModelStatus('error'); toast.error('AI models failed to load.'); });
    }

    return () => { unsub(); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // ── Low-light sampler ────────────────────────────────────────────────────
  const checkLowLight = (video) => {
    try {
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = 10; sampleCanvas.height = 10;
      const ctx = sampleCanvas.getContext('2d');
      const cx = Math.floor(video.videoWidth / 2);
      const cy = Math.floor(video.videoHeight / 2);
      ctx.drawImage(video, cx - 5, cy - 5, 10, 10, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      }
      const avgBrightness = total / 100;
      if (avgBrightness < 30) {
        const now = Date.now();
        if (now - lastLowLightWarn.current > 60000) {
          lastLowLightWarn.current = now;
          toast.warning('Low lighting — ensure your face is clearly visible', { autoClose: 5000 });
        }
      }
    } catch {}
  };

  // ── Detection loop ────────────────────────────────────────────────────────
  const startDetection = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(async () => {
      const { coco, face } = getModels();
      if (!coco || !face) return;
      const wRef = webcamRef.current;
      if (!wRef?.video || wRef.video.readyState !== 4) return;
      const video = wRef.video;
      const vw = video.videoWidth; const vh = video.videoHeight;
      video.width = vw; video.height = vh;
      if (canvasRef.current) { canvasRef.current.width = vw; canvasRef.current.height = vh; }

      checkLowLight(video);

      try {
        const objects = await coco.detect(video);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, vw, vh);
          drawRect(objects, ctx);
        }

        let phoneThisFrame      = false;
        let prohibitedThisFrame = false;

        objects.forEach(({ class: cls, score }) => {
          if (PHONE_CLASSES.has(cls) && score >= 0.55) {
            phoneThisFrame = true;
          }
          if (PROHIBITED_CLASSES.has(cls) && score >= 0.5) {
            prohibitedThisFrame = true;
          }
        });

        recordDetection('cellPhone', phoneThisFrame);
        recordDetection('prohibitedObject', prohibitedThisFrame);

        if (shouldFireViolation('cellPhone'))      handleViolation('cellPhone');
        if (shouldFireViolation('prohibitedObject')) handleViolation('prohibitedObject');

        const faces = await face.estimateFaces(video);

        if (faces.length === 0) {
          noFaceCounterRef.current += 1;
          if (noFaceCounterRef.current >= 4) {
            handleViolation('noFace');
          }
        } else {
          noFaceCounterRef.current = 0;
          if (faces.length > 1) handleViolation('multipleFace');
        }
      } catch {}
    }, 1400);
  };

  const statusLabel = modelStatus === 'ready' ? 'AI Active' : modelStatus === 'error' ? 'Model Error' : 'Loading…';
  const statusColor = modelStatus === 'ready' ? '#30D158' : modelStatus === 'error' ? '#FF453A' : '#FF9F0A';

  return (
    <Box sx={{ position: 'relative', width: '100%', backgroundColor: '#000', borderRadius: '10px', overflow: 'hidden' }}>
      <Webcam
        ref={webcamRef} audio={false} muted mirrored screenshotFormat="image/jpeg"
        videoConstraints={{ width: 640, height: 480, facingMode: 'user' }}
        style={{ width: '100%', display: 'block' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }} />

      <Box sx={{ position: 'absolute', top: 6, left: 6, display: 'flex', gap: 0.5, flexWrap: 'wrap', zIndex: 20 }}>
        <Box sx={{ backgroundColor: 'rgba(255,69,58,0.9)', borderRadius: '4px', px: 0.75, py: 0.25, display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#fff', animation: 'pulse 1.5s infinite' }} />
          <Typography sx={{ fontSize: '0.5625rem', fontWeight: 800, color: '#fff', letterSpacing: '0.08em', fontFamily: 'Inter,sans-serif' }}>REC</Typography>
        </Box>
        <Box sx={{ backgroundColor: `${statusColor}E0`, borderRadius: '4px', px: 0.75, py: 0.25 }}>
          <Typography sx={{ fontSize: '0.5625rem', fontWeight: 700, color: '#fff', fontFamily: 'Inter,sans-serif' }}>{statusLabel}</Typography>
        </Box>
      </Box>

      {modelStatus === 'loading' && (
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
          <LinearProgress variant="determinate" value={loadProgress}
            sx={{ height: 3, backgroundColor: 'rgba(255,255,255,0.15)', '& .MuiLinearProgress-bar': { backgroundColor: '#0A84FF' } }} />
        </Box>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </Box>
  );
}

function dataURLtoFile(dataUrl, fileName) {
  const arr = dataUrl.split(','); const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]); let n = bstr.length; const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new File([u8], fileName, { type: mime });
}
