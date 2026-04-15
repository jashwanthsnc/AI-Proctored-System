import asyncHandler from "express-async-handler";
import Result from "../models/resultModel.js";
import Question from "../models/quesModel.js";
import CodingQuestion from "../models/codingQuestionModel.js";
import Exam from "../models/examModel.js";
import User from "../models/userModel.js";

// @desc    Save exam result
// @route   POST /api/results
// @access  Private
const saveResult = asyncHandler(async (req, res) => {
  const { examId, answers } = req.body;

  if (!examId || !answers) {
    res.status(400);
    throw new Error("Please provide examId and answers");
  }

  // Get all questions for this exam and exam config for negative marking
  const [questions, exam] = await Promise.all([
    Question.find({ examId }),
    Exam.findOne({ examId }),
  ]);

  const negativeMarkingFactor = exam?.negativeMarking || 0;
  const marksPerQuestion = exam?.marksPerQuestion || 1;

  // Calculate marks
  let totalMarks = 0;
  let correctAnswers = 0;

  for (const question of questions) {
    const userAnswer = answers[question._id.toString()];
    if (userAnswer) {
      const correctOption = question.options.find((opt) => opt.isCorrect);
      if (correctOption && correctOption._id.toString() === userAnswer) {
        totalMarks += question.ansmarks || marksPerQuestion;
        correctAnswers++;
      } else if (negativeMarkingFactor > 0) {
        // Apply negative marking for wrong answers (not for unanswered)
        totalMarks -= negativeMarkingFactor;
      }
    }
  }
  // Clamp to 0 minimum
  totalMarks = Math.max(0, totalMarks);

  // Calculate percentage based on marks (not raw count)
  const maxMarks = questions.reduce((sum, q) => sum + (q.ansmarks || marksPerQuestion), 0);
  const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

  const result = await Result.create({
    examId,
    userId: req.user._id,
    answers: new Map(Object.entries(answers)),
    totalMarks,
    percentage,
    showToStudent: false, // Default to false, teacher can change this
  });

  res.status(201).json({
    success: true,
    data: result,
  });
});

// @desc    Get results for a specific exam (for teachers)
// @route   GET /api/results/exam/:examId
// @access  Private
const getResultsByExamId = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  // Get MCQ results
  const results = await Result.find({ examId })
    .populate("userId", "name email")
    .sort({ createdAt: -1 });

  // Get coding questions and all submissions
  const codingQuestions = await CodingQuestion.find({ examId });

  // Combine MCQ and coding results
  const combinedResults = results.map((result) => {
    const studentId = result.userId._id.toString();
    const studentCodingSubmissions = codingQuestions
      .map((q) => {
        const sub = q.submissions.find((s) => s.userId.toString() === studentId);
        if (!sub) return null;
        return {
          question: q.question,
          code: sub.code,
          language: sub.language,
          status: sub.status,
          executionTime: sub.executionTime,
          submittedAt: sub.submittedAt,
        };
      })
      .filter(Boolean);

    return {
      ...result.toObject(),
      codingSubmissions: studentCodingSubmissions,
    };
  });

  res.status(200).json({
    success: true,
    data: combinedResults,
  });
});

// @desc    Get results for current user
// @route   GET /api/results/user
// @access  Private
const getUserResults = asyncHandler(async (req, res) => {
  const results = await Result.find({
    userId: req.user._id,
    showToStudent: true, // Only show results that are marked as visible
  }).sort({
    createdAt: -1,
  });

  // Collect unique examIds and batch-fetch exam names
  const uniqueExamIds = [...new Set(results.map((r) => r.examId))];
  const exams = await Exam.find({ examId: { $in: uniqueExamIds } }).select(
    "examId examName subject passingScore"
  );
  const examMap = {};
  exams.forEach((e) => { examMap[e.examId] = e; });

  // Get coding submissions for each exam
  const resultsWithCoding = await Promise.all(
    results.map(async (result) => {
      const codingQuestions = await CodingQuestion.find({
        examId: result.examId,
        "submissions.userId": req.user._id,
      }).select("question submissions");

      const examInfo = examMap[result.examId] || null;

      return {
        ...result.toObject(),
        examId: examInfo
          ? { _id: result.examId, examName: examInfo.examName, subject: examInfo.subject, passingScore: examInfo.passingScore }
          : result.examId,
        codingSubmissions: codingQuestions.map((q) => {
          const sub = q.submissions.find(
            (s) => s.userId.toString() === req.user._id.toString()
          );
          return {
            question: q.question,
            code: sub?.code,
            language: sub?.language,
            status: sub?.status,
          };
        }),
      };
    })
  );

  res.status(200).json({
    success: true,
    data: resultsWithCoding,
  });
});

// @desc    Toggle showToStudent for a result
// @route   PUT /api/results/:resultId/toggle-visibility
// @access  Private (Teacher only)
const toggleResultVisibility = asyncHandler(async (req, res) => {
  const { resultId } = req.params;

  const result = await Result.findById(resultId);
  if (!result) {
    res.status(404);
    throw new Error("Result not found");
  }

  result.showToStudent = !result.showToStudent;
  await result.save();

  res.status(200).json({
    success: true,
    data: result,
  });
});

// @desc    Get all results (for teachers)
// @route   GET /api/results/all
// @access  Private (Teacher only)
const getAllResults = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view all results");
  }

  const { page = 1, limit = 50, examId: filterExamId, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const query = {};
  if (filterExamId) query.examId = filterExamId;

  let results = await Result.find(query)
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Filter by search (applied after populate)
  if (search) {
    const s = search.toLowerCase();
    results = results.filter(
      (r) =>
        r.userId?.name?.toLowerCase().includes(s) ||
        r.userId?.email?.toLowerCase().includes(s)
    );
  }

  const total = await Result.countDocuments(query);

  // Get coding questions and submissions (no populate — submissions is embedded)
  const allCodingQuestions = await CodingQuestion.find().select("question submissions examId");

  // Combine MCQ and coding results
  const combinedResults = results.map((result) => {
    const studentId = result.userId._id.toString();
    const studentCodingSubmissions = allCodingQuestions
      .map((q) => {
        const sub = q.submissions?.find((s) => s.userId?.toString() === studentId);
        if (!sub) return null;
        return {
          question: q.question,
          code: sub.code,
          language: sub.language,
          status: sub.status,
          executionTime: sub.executionTime,
        };
      })
      .filter(Boolean);

    return {
      ...result.toObject(),
      codingSubmissions: studentCodingSubmissions,
    };
  });

  res.status(200).json({
    success: true,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: combinedResults,
  });
});

// @desc    Bulk release results for an exam (set showToStudent = true)
// @route   POST /api/results/bulk-release
// @access  Private (Teacher only)
const bulkReleaseResults = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }
  const { examId } = req.body;
  const query = examId ? { examId } : {};
  const updated = await Result.updateMany(query, { showToStudent: true });
  res.status(200).json({ success: true, modifiedCount: updated.modifiedCount });
});

// @desc    Export results as CSV
// @route   GET /api/results/export
// @access  Private (Teacher only)
const exportResultsCSV = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }

  const { examId } = req.query;
  const query = examId ? { examId } : {};

  const results = await Result.find(query)
    .populate("userId", "name email institution department studentId")
    .sort({ createdAt: -1 });

  // Enrich with exam names
  const examCache = {};
  const getExamName = async (eId) => {
    if (!examCache[eId]) {
      const exam = await Exam.findOne({ examId: eId }).select("examName passingScore");
      examCache[eId] = exam;
    }
    return examCache[eId];
  };

  const rows = await Promise.all(
    results.map(async (r) => {
      const exam = await getExamName(r.examId);
      const passed = r.percentage >= (exam?.passingScore || 60) ? "Pass" : "Fail";
      return [
        `"${r.userId?.name || "Unknown"}"`,
        `"${r.userId?.email || "N/A"}"`,
        `"${r.userId?.institution || ""}"`,
        `"${r.userId?.studentId || ""}"`,
        `"${exam?.examName || r.examId}"`,
        r.totalMarks,
        r.percentage?.toFixed(2),
        passed,
        r.showToStudent ? "Released" : "Hidden",
        `"${new Date(r.createdAt).toLocaleString()}"`,
      ].join(",");
    })
  );

  const header = "Student Name,Email,Institution,Student ID,Exam,Total Marks,Percentage,Status,Visibility,Submitted At";
  const csv = [header, ...rows].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="results_${examId || "all"}_${Date.now()}.csv"`
  );
  res.send(csv);
});

// @desc    Add feedback to a result
// @route   PUT /api/results/:resultId/feedback
// @access  Private (Teacher only)
const addFeedback = asyncHandler(async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }

  const { resultId } = req.params;
  const { feedback } = req.body;

  const result = await Result.findById(resultId);
  if (!result) {
    res.status(404);
    throw new Error("Result not found");
  }

  result.feedback = feedback || "";
  result.gradedBy = req.user._id;
  result.gradedAt = new Date();
  await result.save();

  res.status(200).json({ success: true, data: result });
});

// @desc    Get exam performance summary (avg score, pass rate, etc.)
// @route   GET /api/results/summary/:examId
// @access  Private (Teacher only)
const getExamSummary = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const results = await Result.find({ examId });

  if (results.length === 0) {
    return res.status(200).json({
      success: true,
      data: { count: 0, avgScore: 0, passRate: 0, highScore: 0, lowScore: 0 },
    });
  }

  const exam = await Exam.findOne({ examId }).select("passingScore examName");
  const passingScore = exam?.passingScore || 60;

  const scores = results.map((r) => r.percentage);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const passCount = scores.filter((s) => s >= passingScore).length;

  res.status(200).json({
    success: true,
    data: {
      examName: exam?.examName || examId,
      count: results.length,
      avgScore: parseFloat(avgScore.toFixed(2)),
      passRate: parseFloat(((passCount / results.length) * 100).toFixed(2)),
      highScore: Math.max(...scores),
      lowScore: Math.min(...scores),
      released: results.filter((r) => r.showToStudent).length,
      pending: results.filter((r) => !r.showToStudent).length,
    },
  });
});

export {
  saveResult,
  getResultsByExamId,
  getUserResults,
  toggleResultVisibility,
  getAllResults,
  bulkReleaseResults,
  exportResultsCSV,
  addFeedback,
  getExamSummary,
};
