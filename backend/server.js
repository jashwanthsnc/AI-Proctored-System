import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import { exec } from "child_process";
import fs from "fs";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import path from "path";
import os from "os";
import { randomBytes } from "crypto";
import { fileURLToPath } from "url";
import cors from "cors";
import jwt from "jsonwebtoken";
import User from "./models/userModel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirnameBE = path.dirname(__filename);
dotenv.config({ path: path.join(__dirnameBE, ".env") });
connectDB();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});
const port = process.env.PORT || 5000;

// ── Simple in-memory rate limiter ──────────────────────────────────────────
const rateLimitStore = new Map();
const createRateLimiter = (windowMs, max, message) => (req, res, next) => {
  const key = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  // Remove old entries
  const requests = rateLimitStore.get(key).filter((t) => t > windowStart);
  rateLimitStore.set(key, requests);

  if (requests.length >= max) {
    return res.status(429).json({ message });
  }

  requests.push(now);
  next();
};

// Clean up rate limit store every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of rateLimitStore.entries()) {
    const recent = times.filter((t) => t > now - 15 * 60 * 1000);
    if (recent.length === 0) rateLimitStore.delete(key);
    else rateLimitStore.set(key, recent);
  }
}, 5 * 60 * 1000);

const authLimiter = createRateLimiter(15 * 60 * 1000, 20, "Too many login attempts. Please try again in 15 minutes.");
const apiLimiter = createRateLimiter(1 * 60 * 1000, 120, "Too many requests. Please slow down.");
const codeExecLimiter = createRateLimiter(1 * 60 * 1000, 15, "Code execution rate limit exceeded.");

// ── Middleware ──────────────────────────────────────────────────────────────
// to parse req body
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl)
      // and any origin on local network for LAN testing
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Apply general rate limiting to all API routes
app.use("/api/", apiLimiter);

const EXEC_TIMEOUT_MS = 10000; // 10-second limit per submission

app.post("/run-python", codeExecLimiter, (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).send("Error: No code provided");
  }

  const uid = randomBytes(8).toString("hex");
  const scriptPath = path.join(os.tmpdir(), `pysc_${uid}.py`);

  try {
    writeFileSync(scriptPath, code);
  } catch {
    return res.status(500).send("Error: Failed to write script file");
  }

  exec(`python "${scriptPath}"`, { timeout: EXEC_TIMEOUT_MS }, (error, stdout, stderr) => {
    try { fs.unlinkSync(scriptPath); } catch {}
    if (error) {
      res.send(error.killed ? "Error: Execution timed out (10s limit)" : `Error is: ${stderr}`);
    } else {
      res.send(stdout);
    }
  });
});

app.post("/run-javascript", codeExecLimiter, (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).send("Error: No code provided");
  }

  const uid = randomBytes(8).toString("hex");
  const scriptPath = path.join(os.tmpdir(), `jss_${uid}.js`);

  try {
    writeFileSync(scriptPath, code);
  } catch {
    return res.status(500).send("Error: Failed to write script file");
  }

  exec(`node "${scriptPath}"`, { timeout: EXEC_TIMEOUT_MS }, (error, stdout, stderr) => {
    try { fs.unlinkSync(scriptPath); } catch {}
    if (error) {
      res.send(error.killed ? "Error: Execution timed out (10s limit)" : `Error: ${stderr}`);
    } else {
      res.send(stdout);
    }
  });
});

app.post("/run-java", codeExecLimiter, (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return res.status(400).send("Error: No code provided");
  }

  const uid = randomBytes(8).toString("hex");
  const tmpDir = path.join(os.tmpdir(), `java_${uid}`);

  try {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(path.join(tmpDir, "Main.java"), code);
  } catch {
    return res.status(500).send("Error: Failed to write script file");
  }

  exec(
    `javac "${path.join(tmpDir, "Main.java")}" && java -cp "${tmpDir}" Main`,
    { timeout: EXEC_TIMEOUT_MS + 5000 }, // Java compile + run needs a bit more time
    (error, stdout, stderr) => {
      try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      if (error) {
        res.send(error.killed ? "Error: Execution timed out (15s limit)" : `Error: ${stderr}`);
      } else {
        res.send(stdout);
      }
    }
  );
});

// Routes (apply auth rate limit to login/register)
app.use("/api/users/auth", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/users", userRoutes);
app.use("/api/users", examRoutes);
app.use("/api/users", resultRoutes);
app.use("/api/coding", codingRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    activeStudents: activeStudents.size,
  });
});

// we we are deploying this in production
// make frontend build then
if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  // we making front build folder static to serve from this app
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  // if we get an routes that are not define by us we show then index html file
  // every enpoint that is not api/users go to this index file
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("<h1>server is running </h1>");
  });
}

// Make io accessible to controllers via req.app.get("io")
app.set("io", io);

// Socket.io JWT authentication middleware
io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").filter(Boolean).map((c) => {
        const [key, ...val] = c.split("=");
        return [key, val.join("=")];
      })
    );
    const token = cookies.jwt;

    if (!token) {
      return next(new Error("Authentication error: No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// In-memory active students tracker
const activeStudents = new Map();

// Helper to broadcast active student list to all teachers
const broadcastActiveStudents = () => {
  const studentList = Array.from(activeStudents.values());
  io.to("teachers").emit("student:active-list", studentList);
};

// Socket.io connection handler
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.user.email} (${socket.user.role})`);

  // Teachers automatically join the "teachers" room
  if (socket.user.role === "teacher") {
    socket.join("teachers");
    console.log(`Teacher ${socket.user.email} joined teachers room`);
    // Send current active students list to newly connected teacher
    socket.emit("student:active-list", Array.from(activeStudents.values()));
  }

  // Student joins an exam
  socket.on("student:join-exam", (data) => {
    const { examId, email, username, examName } = data;
    const key = `${email}-${examId}`;
    const ts = new Date().toISOString();

    // ── Duplicate session detection ──────────────────────────────────────────
    if (activeStudents.has(key)) {
      const existing = activeStudents.get(key);
      if (existing.socketId !== socket.id) {
        // A different socket is already active for this student+exam
        console.log(`[DUPLICATE SESSION] ${email} joined exam ${examId} from a second device (${existing.socketId} → ${socket.id})`);

        // Alert all teachers
        io.to("teachers").emit("teacher:duplicate-session", {
          email,
          username,
          examId,
          examName,
          timestamp: ts,
          severity: "critical",
        });

        // Warn the new (second) socket — probably the cheating device
        socket.emit("student:warning", {
          type: "duplicate-session",
          message: "⚠️ A session for this exam is already active on another device. This incident has been reported to your teacher.",
          timestamp: ts,
        });

        // Also warn the original socket
        io.to(existing.socketId).emit("student:warning", {
          type: "duplicate-session",
          message: "⚠️ Someone joined this exam using your account from another device. Alert sent to teacher.",
          timestamp: ts,
        });

        // Update existing entry to track dual-device flag
        existing.duplicateSessionCount = (existing.duplicateSessionCount || 0) + 1;
        existing.lastDuplicateSession = ts;
        activeStudents.set(key, existing);
        broadcastActiveStudents();
        return; // don't register the second socket as the main student entry
      }
    }

    activeStudents.set(key, {
      email,
      username,
      examId,
      examName,
      lastActivity: ts,
      status: "active",
      socketId: socket.id,
    });

    // Store the key on the socket for cleanup on disconnect
    socket.studentKey = key;

    console.log(`Student ${email} joined exam ${examId}. Active students: ${activeStudents.size}`);
    broadcastActiveStudents();
  });

  // Heartbeat: student sends ping every 30s to keep alive
  socket.on("student:heartbeat", (data) => {
    const { examId, email } = data || {};
    const key = socket.studentKey || `${email}-${examId}`;
    if (activeStudents.has(key)) {
      const entry = activeStudents.get(key);
      entry.lastActivity = new Date().toISOString();
      activeStudents.set(key, entry);
    }
    socket.emit("student:heartbeat-ack", { ts: Date.now() });
  });

  // Teacher requests refresh of active list
  socket.on("teacher:refresh", () => {
    if (socket.user.role === "teacher") {
      socket.emit("student:active-list", Array.from(activeStudents.values()));
    }
  });

  // Student detected an external display — broadcast high-priority alert to all teachers
  socket.on("student:display-alert", (data) => {
    const { examId, email, username, examName, screenCount, screens, method, timestamp } = data || {};

    // Update the active student record with display alert info
    const key = socket.studentKey || `${email}-${examId}`;
    if (activeStudents.has(key)) {
      const entry = activeStudents.get(key);
      entry.displayAlertCount = (entry.displayAlertCount || 0) + 1;
      entry.lastDisplayAlert  = timestamp || new Date().toISOString();
      entry.lastDisplayScreens = screens || [];
      activeStudents.set(key, entry);
      broadcastActiveStudents();
    }

    // Broadcast to all connected teachers immediately
    io.to("teachers").emit("teacher:display-alert", {
      examId,
      email,
      username,
      examName,
      screenCount : screenCount || 2,
      screens     : screens || [],
      method      : method || "detected",
      timestamp   : timestamp || new Date().toISOString(),
      severity    : "critical",
    });

    console.log(`[DISPLAY ALERT] ${username} (${email}) has ${screenCount} screens — exam: ${examName}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.user.email}`);

    // Remove student from active list on disconnect
    if (socket.studentKey && activeStudents.has(socket.studentKey)) {
      activeStudents.delete(socket.studentKey);
      console.log(`Student ${socket.user.email} removed. Active students: ${activeStudents.size}`);
      broadcastActiveStudents();
    }
  });
});

// Stale student cleanup: remove students who haven't sent a heartbeat in 3 minutes
setInterval(() => {
  const staleThreshold = 3 * 60 * 1000; // 3 minutes
  const now = Date.now();
  let cleaned = 0;

  for (const [key, student] of activeStudents.entries()) {
    if (now - new Date(student.lastActivity).getTime() > staleThreshold) {
      activeStudents.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`Cleaned ${cleaned} stale students. Active: ${activeStudents.size}`);
    broadcastActiveStudents();
  }
}, 60 * 1000); // runs every minute

// Error handling middleware - must be after all routes
app.use(notFound);
app.use(errorHandler);

// Server
server.listen(port, "0.0.0.0", () => {
  console.log(`server is running on http://localhost:${port}`);
});

// Todos:
// -**POST /api/users**- Register a users
// -**POST /api/users/auth**- Authenticate a user and get token
// -**POST /api/users/logout**- logou user and clear cookie
// -**GET /api/users/profile**- Get user Profile
// -**PUT /api/users/profile**- Update user Profile
