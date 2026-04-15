import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  saveResult,
  getResultsByExamId,
  getUserResults,
  toggleResultVisibility,
  getAllResults,
  bulkReleaseResults,
  exportResultsCSV,
  addFeedback,
  getExamSummary,
} from "../controllers/resultController.js";

const resultRoutes = express.Router();

// All routes are protected
resultRoutes.use(protect);

// Save result
resultRoutes.post("/results", saveResult);

// Export results as CSV (must be before parameterized routes)
resultRoutes.get("/results/export", exportResultsCSV);

// Get all results (for teachers)
resultRoutes.get("/results/all", getAllResults);

// Get results for a specific exam (for teachers)
resultRoutes.get("/results/exam/:examId", getResultsByExamId);

// Get exam performance summary
resultRoutes.get("/results/summary/:examId", getExamSummary);

// Get results for current user
resultRoutes.get("/results/user", getUserResults);

// Toggle result visibility
resultRoutes.put("/results/:resultId/toggle-visibility", toggleResultVisibility);

// Add feedback to a result
resultRoutes.put("/results/:resultId/feedback", addFeedback);

// Bulk release results for an exam
resultRoutes.post("/results/bulk-release", bulkReleaseResults);

export default resultRoutes;
