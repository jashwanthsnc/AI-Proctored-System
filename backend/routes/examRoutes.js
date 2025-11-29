import express from "express";

import { protect, teacherOnly, checkExamEligibility } from "../middleware/authMiddleware.js";
import {
  createExam,
  DeleteExamById,
  getExams,
  updateExam,
  assignStudentsToExam,
  getEligibleStudents,
  removeStudentsFromExam,
} from "../controllers/examController.js";
import {
  createQuestion,
  getQuestionsByExamId,
  updateQuestion,
  deleteQuestion,
} from "../controllers/quesController.js";
import {
  getCheatingLogsByExamId,
  saveCheatingLog,
  getActiveStudents,
  getRecentViolations,
  getProctoringStats,
} from "../controllers/cheatingLogController.js";
const examRoutes = express.Router();

// protecting Exam route using auth middleware protect /api/users/
examRoutes.route("/exam").get(protect, getExams).post(protect, createExam);
examRoutes.route("/exam/questions").post(protect, createQuestion);
examRoutes.route("/exam/questions/:examId").get(protect, checkExamEligibility, getQuestionsByExamId);
examRoutes.route("/exam/question/:id")
  .put(protect, teacherOnly, updateQuestion)
  .delete(protect, teacherOnly, deleteQuestion);
examRoutes.route("/cheatingLogs/:examId").get(protect, getCheatingLogsByExamId);
examRoutes.route("/cheatingLogs/").post(protect, saveCheatingLog);
examRoutes.route("/exam/:examId")
  .put(protect, teacherOnly, updateExam)
  .post(protect, DeleteExamById);

// Student assignment routes (teacher only)
examRoutes
  .route("/exam/:examId/students")
  .get(protect, teacherOnly, getEligibleStudents)
  .post(protect, teacherOnly, assignStudentsToExam)
  .delete(protect, teacherOnly, removeStudentsFromExam);

// Live proctoring routes (teacher only)
examRoutes.route("/exam/active-students").get(protect, teacherOnly, getActiveStudents);
examRoutes.route("/exam/recent-violations").get(protect, teacherOnly, getRecentViolations);
examRoutes.route("/exam/proctoring-stats").get(protect, teacherOnly, getProctoringStats);

export default examRoutes;
