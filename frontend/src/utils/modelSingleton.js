import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import * as faceDetection from '@tensorflow-models/face-detection';

let cocoModel = null;
let faceModel = null;
let loadingPromise = null;
let status = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
const listeners = new Set();

const notify = (s) => { status = s; listeners.forEach(fn => fn(s)); };

export const getModelStatus = () => status;

export const onModelStatusChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const getModels = () => ({ coco: cocoModel, face: faceModel });

// Resolve the solutionPath for MediaPipe — works on both localhost and Electron
const getMediaPipePath = () => {
  try {
    return `${window.location.origin}/models/mediapipe-face`;
  } catch {
    return 'http://localhost:3000/models/mediapipe-face';
  }
};

export const loadModels = async (onProgress) => {
  if (status === 'ready') { onProgress?.(100); return { coco: cocoModel, face: faceModel }; }
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      notify('loading');
      onProgress?.(5);
      await tf.ready();
      onProgress?.(15);

      // Load coco-ssd from local public folder (downloaded at build time)
      // Falls back to CDN if local files aren't present
      try {
        cocoModel = await cocossd.load({ modelUrl: '/models/coco-ssd/model.json' });
      } catch {
        cocoModel = await cocossd.load();
      }
      onProgress?.(65);

      // Load face detection using local mediapipe WASM (no CDN needed)
      faceModel = await faceDetection.createDetector(
        faceDetection.SupportedModels.MediaPipeFaceDetector,
        {
          runtime: 'mediapipe',
          solutionPath: getMediaPipePath(),
          maxFaces: 4,
        }
      );
      onProgress?.(100);
      notify('ready');
      return { coco: cocoModel, face: faceModel };
    } catch (err) {
      notify('error');
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
};

export const areModelsReady = () => status === 'ready' && cocoModel !== null && faceModel !== null;

export const resetModels = () => {
  cocoModel = null;
  faceModel = null;
  loadingPromise = null;
  status = 'idle';
  notify('idle');
};
