import express from "express";
import {
  authUser,
  getUserProfile,
  logoutUser,
  registerUser,
  updateUserProfile,
  getAllStudents,
  addStudent,
} from "../controllers/userController.js";
import { protect, teacherOnly } from "../middleware/authMiddleware.js";
import { createExam, getExams } from "../controllers/examController.js";

const userRoutes = express.Router();

userRoutes.post("/", registerUser);
userRoutes.post("/auth", authUser);
userRoutes.post("/logout", logoutUser);
userRoutes.post("/register", registerUser);

// protecting profile route using auth middleware protect
userRoutes
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Student management routes (teacher only)
userRoutes
  .route("/students")
  .get(protect, teacherOnly, getAllStudents)
  .post(protect, teacherOnly, addStudent);

export default userRoutes;
