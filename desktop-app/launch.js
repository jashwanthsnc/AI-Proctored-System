/**
 * launch.js — cross-platform Electron launcher
 *
 * npm scripts on Windows execute via cmd.exe, so `unset` is unavailable.
 * This script strips ELECTRON_RUN_AS_NODE from the environment before
 * spawning Electron so the browser-process initialises correctly even
 * when the parent shell (e.g. Git Bash) has set that variable.
 */

const { spawn } = require('child_process');
const electronPath = require('./node_modules/electron');  // returns binary path string

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;   // must be absent (not just empty) for Electron to run in app mode

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  windowsHide: false,
  env,
});

child.on('close', (code, signal) => {
  if (code === null) {
    console.error(electronPath, 'exited with signal', signal);
    process.exit(1);
  }
  process.exit(code);
});
