import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import Exam from "../models/examModel.js";

const protect = asyncHandler(async (req, res, next) => {
  // because of cookie parser we able to use this here
  let token = req.cookies.jwt;

  // cookie present
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // this userID come from generate token
      // when we use jwt.sign we pass payload as userId and now we can access it here
      // this user will contain full bj including password we dont want to send it so we
      // remove it using -passowrd
      req.user = await User.findById(decoded.userId).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not Authorized , Invalid Token ");
    }
  } else {
    // no token present
    res.status(401);
    throw new Error("Not Authorized , no Token ");
  }
});

// Middleware to check if user is a teacher
const teacherOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "teacher") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied. Teachers only.");
  }
});

// Middleware to check if student is eligible for an exam
const checkExamEligibility = asyncHandler(async (req, res, next) => {
  const { examId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Teachers can access any exam
  if (userRole === "teacher") {
    return next();
  }

  // For students, check if they're in the eligibleStudents array
  const exam = await Exam.findOne({ examId });

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // Check if student is in the eligible students list
  const isEligible = exam.eligibleStudents.some(
    (studentId) => studentId.toString() === userId.toString()
  );

  if (!isEligible) {
    res.status(403);
    throw new Error("You are not authorized to access this exam");
  }

  next();
});

export { protect, teacherOnly, checkExamEligibility };
