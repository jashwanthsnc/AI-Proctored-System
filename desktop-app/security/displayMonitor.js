/**
 * displayMonitor.js
 * Detects virtual and extra displays connected to the system.
 *
 * Uses PowerShell (Windows) or system_profiler (macOS) to enumerate
 * all active monitors, including virtual displays created by:
 *   - SpaceDesk (virtual display driver)
 *   - Parsec VDD (Virtual Display Driver)
 *   - IDD (Indirect Display Driver)
 *   - AirPlay / wireless displays
 *
 * Fires onDetected(count, displays[]) when more than one display is found.
 */

const { exec } = require('child_process');
const os = require('os');

// ── Known virtual display driver substrings ───────────────────────────────────
const VIRTUAL_DISPLAY_NAMES = [
  'spacedesk', 'parsec', 'idd', 'virtual', 'indirect',
  'miracast', 'airplay', 'airscreen', 'dummy', 'generic pnp',
];

// ── Platform commands ─────────────────────────────────────────────────────────
const getDisplayCommand = () => {
  switch (os.platform()) {
    case 'win32':
      // Get all active PnP monitor devices with friendly names
      return `powershell -NoProfile -Command "Get-PnpDevice -Class Monitor | Where-Object {$_.Status -eq 'OK'} | Select-Object FriendlyName,InstanceId | ConvertTo-Json -Compress"`;
    case 'darwin':
      return `system_profiler SPDisplaysDataType -json`;
    default:
      // Linux: xrandr for connected displays
      return `xrandr --query 2>/dev/null | grep ' connected'`;
  }
};

// ── Parsers ───────────────────────────────────────────────────────────────────
const parseWindows = (stdout) => {
  try {
    const data = JSON.parse(stdout);
    const items = Array.isArray(data) ? data : [data];
    return items.map(d => ({
      name: d.FriendlyName || d.InstanceId || 'Unknown Monitor',
      isVirtual: VIRTUAL_DISPLAY_NAMES.some(v => (d.FriendlyName || '').toLowerCase().includes(v)),
    }));
  } catch {
    return [];
  }
};

const parseMacOS = (stdout) => {
  try {
    const data = JSON.parse(stdout);
    const displays = data?.SPDisplaysDataType?.[0]?.spdisplays_ndrvs || [];
    return displays.map(d => ({
      name: d['_name'] || 'Unknown Display',
      isVirtual: VIRTUAL_DISPLAY_NAMES.some(v => (d['_name'] || '').toLowerCase().includes(v)),
    }));
  } catch {
    return [];
  }
};

const parseLinux = (stdout) => {
  return stdout.trim().split('\n')
    .filter(Boolean)
    .map(line => {
      const name = line.split(' ')[0] || 'Unknown';
      return {
        name,
        isVirtual: VIRTUAL_DISPLAY_NAMES.some(v => name.toLowerCase().includes(v)),
      };
    });
};

const parseDisplays = (stdout) => {
  const platform = os.platform();
  if (platform === 'win32') return parseWindows(stdout);
  if (platform === 'darwin') return parseMacOS(stdout);
  return parseLinux(stdout);
};

// ── Public API ────────────────────────────────────────────────────────────────
let _intervalId = null;
let _prevKey = null; // sorted display-name fingerprint to detect config changes

/**
 * Start monitoring for extra/virtual displays.
 * Calls onDetected only when the display configuration changes (new displays
 * appear or count changes), not on every poll cycle.
 * @param {number} intervalMs
 * @param {Function} onDetected  Called with (count, displays[]) when config changes
 */
const start = (intervalMs = 8000, onDetected) => {
  stop(); // clear any existing interval + reset previous state

  const scan = () => {
    const cmd = getDisplayCommand();
    exec(cmd, { timeout: 10000 }, (err, stdout) => {
      if (err || !stdout?.trim()) return;
      const displays = parseDisplays(stdout);
      if (displays.length > 1) {
        const key = displays.map(d => d.name.toLowerCase()).sort().join('|');
        if (key !== _prevKey) {
          _prevKey = key;
          onDetected(displays.length, displays);
        }
      }
    });
  };

  scan();
  _intervalId = setInterval(scan, intervalMs);
};

const stop = () => {
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  _prevKey = null;
};

module.exports = { start, stop };
