/**
 * networkMonitor.js
 * Inspects active network connections for ports commonly used by
 * screen-casting and remote-access software.
 *
 * Works on Windows (netstat -ano), macOS/Linux (netstat -anp / ss -tnp).
 */

const { exec } = require('child_process');
const os = require('os');

// ── Known casting / remote-control ports ─────────────────────────────────────
const SUSPICIOUS_PORTS = [
  // Chromecast / Google Cast
  { port: 8008,  name: 'Chromecast HTTP' },
  { port: 8009,  name: 'Chromecast TLS'  },
  { port: 5353,  name: 'mDNS (Cast discovery)' },

  // AirPlay / AirScreen
  { port: 7000,  name: 'AirPlay Video'   },
  { port: 7100,  name: 'AirPlay Mirroring' },
  { port: 49152, name: 'AirPlay RTSP'    },

  // Miracast
  { port: 7236,  name: 'Miracast RTSP'   },
  { port: 7250,  name: 'Miracast RTP'    },

  // VNC
  { port: 5900,  name: 'VNC'             },
  { port: 5901,  name: 'VNC display 1'   },
  { port: 5902,  name: 'VNC display 2'   },

  // RDP
  { port: 3389,  name: 'Windows RDP'     },

  // TeamViewer
  { port: 5938,  name: 'TeamViewer'      },

  // AnyDesk
  { port: 7070,  name: 'AnyDesk'         },

  // SpaceDesk
  { port: 28900, name: 'SpaceDesk'       },

  // Parsec
  { port: 8000,  name: 'Parsec'          },

  // NDI (Network Device Interface — broadcast video)
  { port: 5960,  name: 'NDI Discovery'   },
  { port: 5961,  name: 'NDI Stream'      },
];

const PORT_SET = new Set(SUSPICIOUS_PORTS.map(p => p.port));

// ── Helpers ───────────────────────────────────────────────────────────────────
const getConnections = () => new Promise((resolve, reject) => {
  const platform = os.platform();
  const cmd =
    platform === 'win32'  ? 'netstat -ano'  :
    platform === 'darwin' ? 'netstat -an -p tcp' :
                            'ss -tn';

  exec(cmd, { timeout: 8000 }, (err, stdout) => {
    if (err) { reject(err); return; }
    resolve(stdout);
  });
});

const parseConnections = (output) => {
  const detected = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // Extract port numbers from the line
    const portMatches = line.match(/:(\d+)/g);
    if (!portMatches) continue;

    for (const match of portMatches) {
      const port = parseInt(match.slice(1), 10);
      if (PORT_SET.has(port)) {
        const entry = SUSPICIOUS_PORTS.find(p => p.port === port);
        if (entry && !detected.find(d => d.port === port)) {
          // Only flag if there's an ESTABLISHED connection (not just listening)
          const isEstablished = /ESTABLISHED|CONNECTED/i.test(line);
          const isListening   = /LISTEN|LISTENING/i.test(line);
          if (isEstablished || isListening) {
            detected.push({ ...entry, state: isEstablished ? 'ESTABLISHED' : 'LISTENING' });
          }
        }
      }
    }
  }
  return detected;
};

// ── Public API ────────────────────────────────────────────────────────────────
let _intervalId = null;
let _seen = new Set(); // ports already reported — prevents repeated callbacks

/**
 * Start monitoring network connections.
 * Calls onDetected only for newly detected ports since the last stop/start.
 * @param {number} intervalMs
 * @param {Function} onDetected  Callback with array of { port, name, state }
 */
const start = (intervalMs = 10000, onDetected) => {
  stop(); // clear any existing interval + reset seen set

  const scan = async () => {
    try {
      const output  = await getConnections();
      const found   = parseConnections(output);
      const newOnes = found.filter(f => !_seen.has(f.port));
      if (newOnes.length > 0) {
        newOnes.forEach(f => _seen.add(f.port));
        onDetected(newOnes);
      }
    } catch {
      // continue silently
    }
  };

  scan();
  _intervalId = setInterval(scan, intervalMs);
};

const stop = () => {
  if (_intervalId) { clearInterval(_intervalId); _intervalId = null; }
  _seen.clear();
};

module.exports = { start, stop };
