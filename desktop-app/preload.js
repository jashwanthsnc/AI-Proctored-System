/**
 * preload.js
 * Runs in the renderer context with Node access disabled.
 * Bridges IPC messages from main process to the web app running inside.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronSecurity', {
  // Listen for security violation events from main process
  onViolation: (callback) => {
    ipcRenderer.on('security:violation', (_event, data) => callback(data));
  },

  // Listen for exam-blocking events (critical — exam must stop)
  onBlock: (callback) => {
    ipcRenderer.on('security:block', (_event, data) => callback(data));
  },

  // Student can signal exam start/end to main process
  examStarted:  (examId) => ipcRenderer.send('exam:started',  { examId }),
  examFinished: (examId) => ipcRenderer.send('exam:finished', { examId }),

  // Get current security status
  getStatus: () => ipcRenderer.invoke('security:status'),

  // Platform info
  platform: process.platform,
  isDesktopApp: true,
});
