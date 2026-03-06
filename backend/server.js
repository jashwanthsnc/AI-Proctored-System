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
});
const port = process.env.PORT || 5000;

// to parse req body
app.use(express.json());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, curl)
      // and any origin on local network for LAN testing
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const EXEC_TIMEOUT_MS = 10000; // 10-second limit per submission

app.post("/run-python", (req, res) => {
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

app.post("/run-javascript", (req, res) => {
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

app.post("/run-java", (req, res) => {
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

// Routes
app.use("/api/users", userRoutes);
app.use("/api/users", examRoutes);
app.use("/api/users", resultRoutes);
app.use("/api/coding", codingRoutes);

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

    activeStudents.set(key, {
      email,
      username,
      examId,
      examName,
      lastActivity: new Date().toISOString(),
      status: "active",
      socketId: socket.id,
    });

    // Store the key on the socket for cleanup on disconnect
    socket.studentKey = key;

    console.log(`Student ${email} joined exam ${examId}. Active students: ${activeStudents.size}`);
    broadcastActiveStudents();
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
