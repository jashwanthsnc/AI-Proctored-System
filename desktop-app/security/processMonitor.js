/**
 * processMonitor.js
 * Scans running OS processes every interval and flags anything on the
 * blacklist (screen-casting, screen-recording, remote-control software).
 *
 * Works on Windows (tasklist), macOS (ps aux), Linux (ps aux).
 */

const { exec } = require('child_process');
const os = require('os');

// ── Blacklist ─────────────────────────────────────────────────────────────────
// Each entry: { name: display label, patterns: [regex strings to match process names] }
const BLACKLIST = [
  // Screen recording
  { name: 'OBS Studio',          patterns: ['obs64', 'obs32', 'obs.exe', 'obs '] },
  { name: 'Streamlabs OBS',      patterns: ['streamlabs obs', 'slobs'] },
  { name: 'Bandicam',            patterns: ['bdcam'] },
  { name: 'Fraps',               patterns: ['fraps'] },
  { name: 'Camtasia',            patterns: ['camtasia', 'camrec'] },
  { name: 'ShareX',              patterns: ['sharex'] },
  { name: 'Xbox Game Bar',       patterns: ['gamebar', 'gamebarftserver'] },
  { name: 'NVIDIA ShadowPlay',   patterns: ['nvcontainer', 'shadowplay'] },
  { name: 'Action!',             patterns: ['action!', 'mirillis action'] },

  // Remote desktop / VNC
  { name: 'TeamViewer',          patterns: ['teamviewer'] },
  { name: 'AnyDesk',             patterns: ['anydesk'] },
  { name: 'Chrome Remote Desktop', patterns: ['remoting_host', 'chrome_remote_desktop'] },
  { name: 'RealVNC',             patterns: ['vncserver', 'vncviewer', 'realvnc'] },
  { name: 'TightVNC',            patterns: ['tvnserver', 'tvnviewer', 'tightvnc'] },
  { name: 'UltraVNC',            patterns: ['uvnc', 'ultravnc'] },
  { name: 'TigerVNC',            patterns: ['tigervnc', 'winvnc'] },
  { name: 'NoMachine',           patterns: ['nxd', 'nomachine'] },
  { name: 'Parsec',              patterns: ['parsecd', 'parsec'] },
  { name: 'Splashtop',           patterns: ['splashtop'] },
  { name: 'LogMeIn',             patterns: ['logmein'] },
  { name: 'GoToMyPC',            patterns: ['gotomypc'] },
  { name: 'Windows RDP',         patterns: ['mstsc', 'rdclientax'] },

  // Screen mirroring / phone casting
  { name: 'ApowerMirror',        patterns: ['apowermirror', 'apower'] },
  { name: 'MirrorGo',            patterns: ['mirrorgo'] },
  { name: 'LetsView',            patterns: ['letsview'] },
  { name: 'Reflector',           patterns: ['reflector'] },
  { name: 'AirServer',           patterns: ['airserver'] },
  { name: 'Scrcpy',              patterns: ['scrcpy'] },
  { name: 'Vysor',               patterns: ['vysor'] },
  { name: 'ApowerSoft',          patterns: ['apowersoft'] },
  { name: 'NDI Screen Capture',  patterns: ['ndi'] },

  // Virtual display drivers (used for wireless casting)
  { name: 'IDD Virtual Display', patterns: ['iddcx', 'virtual-display-driver'] },
  { name: 'Parsec VDD',          patterns: ['parsecvdd', 'parsec-vdd'] },
  { name: 'SpaceDesk',           patterns: ['spacedesk'] },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getProcessList = () => new Promise((resolve, reject) => {
  const platform = os.platform();
  const cmd =
    platform === 'win32'  ? 'tasklist /FO CSV /NH' :
    platform === 'darwin' ? 'ps -axco command'      :
                            'ps -axco comm';

  exec(cmd, { timeout: 8000 }, (err, stdout) => {
    if (err) { reject(err); return; }
    resolve(stdout.toLowerCase());
  });
});

const checkProcessList = (output) => {
  const detected = [];
  for (const entry of BLACKLIST) {
    for (const pattern of entry.patterns) {
      if (output.includes(pattern.toLowerCase())) {
        if (!detected.find(d => d.name === entry.name)) {
          detected.push({ name: entry.name, pattern });
        }
        break;
      }
    }
  }
  return detected;
};

// ── Public API ────────────────────────────────────────────────────────────────
let _intervalId = null;
let _seen = new Set(); // names already reported — prevents repeated callbacks

/**
 * Start monitoring. Calls onDetected({ name, pattern }[]) only for newly
 * detected apps (not ones already reported since the last stop/start).
 * @param {number} intervalMs  How often to scan (default 3000)
 * @param {Function} onDetected  Callback with array of detected apps
 */
const start = (intervalMs = 3000, onDetected) => {
  stop(); // clear any existing interval + reset seen set

  const scan = async () => {
    try {
      const output   = await getProcessList();
      const found    = checkProcessList(output);
      const newOnes  = found.filter(f => !_seen.has(f.name));
      if (newOnes.length > 0) {
        newOnes.forEach(f => _seen.add(f.name));
        onDetected(newOnes);
      }
    } catch (e) {
      // silently continue if process list fails
    }
  };

  scan(); // immediate first check
  _intervalId = setInterval(scan, intervalMs);
};

const stop = () => {
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  _seen.clear();
};

module.exports = { start, stop, checkProcessList };
