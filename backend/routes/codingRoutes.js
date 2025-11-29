import express from "express";
import {
  submitCodingAnswer,
  createCodingQuestion,
  getCodingQuestions,
  getCodingQuestion,
  getCodingQuestionsByExamId,
  updateCodingQuestion,
  deleteCodingQuestion,
} from "../controllers/codingController.js";
import { protect, checkExamEligibility, teacherOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);

// Student routes
router.post("/submit", submitCodingAnswer);
router.get("/questions/exam/:examId", checkExamEligibility, getCodingQuestionsByExamId);

// Teacher routes
router.post("/question", createCodingQuestion);
router.get("/questions", getCodingQuestions);
router.get("/questions/:id", getCodingQuestion);

// Update and delete routes (teacher only)
router.route("/question/:id")
  .put(teacherOnly, updateCodingQuestion)
  .delete(teacherOnly, deleteCodingQuestion);

export default router;
