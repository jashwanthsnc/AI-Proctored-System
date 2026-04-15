import express from "express";
import {
  authUser,
  getUserProfile,
  logoutUser,
  registerUser,
  updateUserProfile,
  getAllStudents,
  addStudent,
  deleteStudent,
  getSystemStats,
} from "../controllers/userController.js";
import { protect, teacherOnly, adminOrTeacher } from "../middleware/authMiddleware.js";

const userRoutes = express.Router();

userRoutes.post("/auth", authUser);
userRoutes.post("/logout", logoutUser);
userRoutes.post("/register", registerUser);

// protecting profile route using auth middleware protect
userRoutes
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// System stats (teacher/admin)
userRoutes.get("/stats", protect, adminOrTeacher, getSystemStats);

// Student management routes (teacher/admin only)
userRoutes
  .route("/students")
  .get(protect, adminOrTeacher, getAllStudents)
  .post(protect, adminOrTeacher, addStudent);

userRoutes.delete("/students/:id", protect, adminOrTeacher, deleteStudent);

export default userRoutes;
