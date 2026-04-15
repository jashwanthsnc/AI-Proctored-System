import asyncHandler from "express-async-handler";
import Exam from "./../models/examModel.js";
import User from "./../models/userModel.js";
import Question from "./../models/quesModel.js";
import CodingQuestion from "./../models/codingQuestionModel.js";
import Result from "./../models/resultModel.js";
import CheatingLog from "./../models/cheatingLogModel.js";

// @desc Get all exams
// @route GET /api/exams
// @access Public
const getExams = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let exams;

  if (userRole === "student") {
    // For students: only return exams where they are in eligibleStudents array
    exams = await Exam.find({
      eligibleStudents: userId,
    })
      .populate("eligibleStudents", "name email")
      .populate("teacher", "name email");
  } else {
    // For teachers: return only their own exams
    exams = await Exam.find({ teacher: userId })
      .populate("eligibleStudents", "name email")
      .populate("teacher", "name email");
  }

  res.status(200).json(exams);
});

// @desc Create a new exam
// @route POST /api/exams
// @access Private (admin)
const createExam = asyncHandler(async (req, res) => {
  const {
    examName, totalQuestions, duration, liveDate, deadDate,
    description, subject, instructions, passingScore,
    marksPerQuestion, negativeMarking, maxAttempts,
    shuffleQuestions, allowReview, tags,
  } = req.body;

  const exam = new Exam({
    examName,
    totalQuestions,
    duration,
    liveDate,
    deadDate,
    teacher: req.user._id,
    eligibleStudents: [],
    description: description || '',
    subject: subject || '',
    instructions: instructions || '',
    passingScore: passingScore !== undefined ? passingScore : 60,
    marksPerQuestion: marksPerQuestion !== undefined ? marksPerQuestion : 1,
    negativeMarking: negativeMarking !== undefined ? negativeMarking : 0,
    maxAttempts: maxAttempts !== undefined ? maxAttempts : 1,
    shuffleQuestions: shuffleQuestions || false,
    allowReview: allowReview !== undefined ? allowReview : true,
    tags: Array.isArray(tags) ? tags : [],
  });

  const createdExam = await exam.save();

  if (createdExam) {
    res.status(201).json(createdExam);
  } else {
    res.status(400);
    throw new Error("Invalid Exam Data");
  }
});

const DeleteExamById = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findOne({ examId });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // Only the teacher who owns the exam can delete it
  if (exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorised to delete this exam");
  }

  // Cascade delete all related data
  await Promise.all([
    Question.deleteMany({ examId }),
    CodingQuestion.deleteMany({ examId }),
    Result.deleteMany({ examId }),
    CheatingLog.deleteMany({ examId }),
    Exam.deleteOne({ examId }),
  ]);

  res.status(200).json({ success: true, examId });
});

// @desc Update an exam
// @route PUT /api/exams/:examId
// @access Private (teacher)
const updateExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const {
    examName, totalQuestions, duration, liveDate, deadDate,
    description, subject, instructions, passingScore,
    marksPerQuestion, negativeMarking, maxAttempts,
    shuffleQuestions, allowReview, tags,
  } = req.body;

  // Validate required fields
  if (!examName || !totalQuestions || !duration || !liveDate || !deadDate) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Validate dates
  const liveD = new Date(liveDate);
  const deadD = new Date(deadDate);
  if (isNaN(liveD.getTime()) || isNaN(deadD.getTime())) {
    res.status(400);
    throw new Error("Invalid date format for liveDate or deadDate");
  }
  if (deadD <= liveD) {
    res.status(400);
    throw new Error("Deadline must be after live date");
  }

  // Find and update the exam
  const exam = await Exam.findOne({ examId });

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // Check if user is the teacher who created the exam (optional security check)
  if (exam.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("You are not authorized to update this exam");
  }

  // Update exam fields
  exam.examName = examName;
  exam.totalQuestions = totalQuestions;
  exam.duration = duration;
  exam.liveDate = liveDate;
  exam.deadDate = deadDate;
  if (description !== undefined) exam.description = description;
  if (subject !== undefined) exam.subject = subject;
  if (instructions !== undefined) exam.instructions = instructions;
  if (passingScore !== undefined) exam.passingScore = passingScore;
  if (marksPerQuestion !== undefined) exam.marksPerQuestion = marksPerQuestion;
  if (negativeMarking !== undefined) exam.negativeMarking = negativeMarking;
  if (maxAttempts !== undefined) exam.maxAttempts = maxAttempts;
  if (shuffleQuestions !== undefined) exam.shuffleQuestions = shuffleQuestions;
  if (allowReview !== undefined) exam.allowReview = allowReview;
  if (Array.isArray(tags)) exam.tags = tags;

  const updatedExam = await exam.save();

  res.status(200).json({
    success: true,
    message: "Exam updated successfully",
    data: updatedExam,
  });
});

// @desc Assign students to an exam
// @route POST /api/exams/:examId/students
// @access Private (teacher)
const assignStudentsToExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { studentIds } = req.body;

  if (!studentIds || !Array.isArray(studentIds)) {
    res.status(400);
    throw new Error("Please provide an array of student IDs");
  }

  // Find the exam
  const exam = await Exam.findOne({ examId });

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // Verify all student IDs are valid students
  const students = await User.find({
    _id: { $in: studentIds },
    role: "student",
  });

  if (students.length !== studentIds.length) {
    res.status(400);
    throw new Error("Some student IDs are invalid or not students");
  }

  // Add students to eligible list (avoid duplicates)
  const existingIds = exam.eligibleStudents.map((id) => id.toString());
  const newStudentIds = studentIds.filter((id) => !existingIds.includes(id));

  exam.eligibleStudents.push(...newStudentIds);
  await exam.save();

  const updatedExam = await Exam.findOne({ examId }).populate(
    "eligibleStudents",
    "name email"
  );

  res.status(200).json({
    success: true,
    message: `${newStudentIds.length} student(s) added to exam`,
    data: updatedExam,
  });
});

// @desc Get eligible students for an exam
// @route GET /api/exams/:examId/students
// @access Private (teacher)
const getEligibleStudents = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  const exam = await Exam.findOne({ examId }).populate(
    "eligibleStudents",
    "name email"
  );

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  res.status(200).json({
    success: true,
    count: exam.eligibleStudents.length,
    data: exam.eligibleStudents,
  });
});

// @desc Remove students from an exam
// @route DELETE /api/exams/:examId/students
// @access Private (teacher)
const removeStudentsFromExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { studentIds } = req.body;

  const exam = await Exam.findOne({ examId });

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // Remove students from eligible list
  exam.eligibleStudents = exam.eligibleStudents.filter(
    (id) => !studentIds.includes(id.toString())
  );

  await exam.save();

  res.status(200).json({
    success: true,
    message: "Students removed from exam",
    data: exam,
  });
});

// @desc Duplicate an exam
// @route POST /api/exams/:examId/duplicate
// @access Private (teacher)
const duplicateExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const source = await Exam.findOne({ examId });

  if (!source) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (source.teacher.toString() !== req.user._id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to duplicate this exam");
  }

  const copy = new Exam({
    examName: `Copy of ${source.examName}`,
    totalQuestions: source.totalQuestions,
    duration: source.duration,
    liveDate: source.liveDate,
    deadDate: source.deadDate,
    teacher: req.user._id,
    eligibleStudents: [],
    description: source.description,
    subject: source.subject,
    instructions: source.instructions,
    passingScore: source.passingScore,
    marksPerQuestion: source.marksPerQuestion,
    negativeMarking: source.negativeMarking,
    maxAttempts: source.maxAttempts,
    shuffleQuestions: source.shuffleQuestions,
    allowReview: source.allowReview,
    tags: [...(source.tags || [])],
  });

  const saved = await copy.save();
  res.status(201).json(saved);
});

// @desc Get a single exam by examId
// @route GET /api/users/exam/:examId/details
// @access Private
const getExamById = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const exam = await Exam.findOne({ examId })
    .populate("eligibleStudents", "name email")
    .populate("teacher", "name email");

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  res.status(200).json(exam);
});

// @desc Get dashboard exam statistics for teacher
// @route GET /api/users/exam/stats
// @access Private/Teacher
const getExamStats = asyncHandler(async (req, res) => {
  const teacherId = req.user._id;
  const now = new Date();

  const [totalExams, liveExams, upcomingExams, endedExams, totalAssignments] = await Promise.all([
    Exam.countDocuments({ teacher: teacherId }),
    Exam.countDocuments({ teacher: teacherId, liveDate: { $lte: now }, deadDate: { $gte: now } }),
    Exam.countDocuments({ teacher: teacherId, liveDate: { $gt: now } }),
    Exam.countDocuments({ teacher: teacherId, deadDate: { $lt: now } }),
    Exam.aggregate([
      { $match: { teacher: teacherId } },
      { $project: { count: { $size: { $ifNull: ["$eligibleStudents", []] } } } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      total: totalExams,
      live: liveExams,
      upcoming: upcomingExams,
      ended: endedExams,
      totalAssignments: totalAssignments[0]?.total || 0,
    },
  });
});

export {
  getExams,
  createExam,
  DeleteExamById,
  updateExam,
  assignStudentsToExam,
  getEligibleStudents,
  removeStudentsFromExam,
  duplicateExam,
  getExamById,
  getExamStats,
};
