import express from "express";

import { protect, teacherOnly, adminOrTeacher, checkExamEligibility } from "../middleware/authMiddleware.js";
import {
  createExam,
  DeleteExamById,
  getExams,
  updateExam,
  assignStudentsToExam,
  getEligibleStudents,
  removeStudentsFromExam,
  duplicateExam,
  getExamById,
  getExamStats,
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
  getAllCheatingLogs,
  exportCheatingLogsCSV,
} from "../controllers/cheatingLogController.js";
const examRoutes = express.Router();

// protecting Exam route using auth middleware protect /api/users/
examRoutes.route("/exam").get(protect, getExams).post(protect, createExam);
examRoutes.route("/exam/questions").post(protect, createQuestion);
examRoutes.route("/exam/questions/:examId").get(protect, checkExamEligibility, getQuestionsByExamId);
examRoutes.route("/exam/question/:id")
  .put(protect, teacherOnly, updateQuestion)
  .delete(protect, teacherOnly, deleteQuestion);
// Static cheatingLogs routes BEFORE parameterized :examId route
examRoutes.route("/cheatingLogs/export").get(protect, adminOrTeacher, exportCheatingLogsCSV);
examRoutes.route("/cheatingLogs/").post(protect, saveCheatingLog);
examRoutes.route("/cheatingLogs/:examId").get(protect, getCheatingLogsByExamId);
// Live proctoring routes (static — must be BEFORE parameterized :examId routes)
examRoutes.route("/exam/active-students").get(protect, teacherOnly, getActiveStudents);
examRoutes.route("/exam/recent-violations").get(protect, teacherOnly, getRecentViolations);
examRoutes.route("/exam/proctoring-stats").get(protect, teacherOnly, getProctoringStats);
examRoutes.route("/exam/stats").get(protect, adminOrTeacher, getExamStats);

examRoutes.route("/exam/:examId")
  .put(protect, teacherOnly, updateExam)
  .delete(protect, teacherOnly, DeleteExamById);

// Get single exam details
examRoutes.route("/exam/:examId/details").get(protect, getExamById);

// Duplicate exam
examRoutes.route("/exam/:examId/duplicate").post(protect, teacherOnly, duplicateExam);

// Student assignment routes (teacher only)
examRoutes
  .route("/exam/:examId/students")
  .get(protect, teacherOnly, getEligibleStudents)
  .post(protect, teacherOnly, assignStudentsToExam)
  .delete(protect, teacherOnly, removeStudentsFromExam);

// Analytics
examRoutes.route("/allCheatingLogs").get(protect, adminOrTeacher, getAllCheatingLogs);

export default examRoutes;
