import asyncHandler from "express-async-handler";
import Exam from "./../models/examModel.js";
import User from "./../models/userModel.js";

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
    // For teachers and admins: return all exams
    exams = await Exam.find()
      .populate("eligibleStudents", "name email")
      .populate("teacher", "name email");
  }

  res.status(200).json(exams);
});

// @desc Create a new exam
// @route POST /api/exams
// @access Private (admin)
const createExam = asyncHandler(async (req, res) => {
  const { examName, totalQuestions, duration, liveDate, deadDate } = req.body;

  const exam = new Exam({
    examName,
    totalQuestions,
    duration,
    liveDate,
    deadDate,
    teacher: req.user._id,
    eligibleStudents: [],
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
  const exam = await Exam.findOneAndDelete({ examId: examId });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  console.log("deleted exam", exam);
  res.status(200).json(exam);
});

// @desc Update an exam
// @route PUT /api/exams/:examId
// @access Private (teacher)
const updateExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const { examName, totalQuestions, duration, liveDate, deadDate } = req.body;

  // Validate required fields
  if (!examName || !totalQuestions || !duration || !liveDate || !deadDate) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Validate dates
  if (new Date(deadDate) <= new Date(liveDate)) {
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

export {
  getExams,
  createExam,
  DeleteExamById,
  updateExam,
  assignStudentsToExam,
  getEligibleStudents,
  removeStudentsFromExam,
};
