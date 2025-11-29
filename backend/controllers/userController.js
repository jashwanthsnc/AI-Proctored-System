import asyncHandler from "express-async-handler";
import User from "./../models/userModel.js";
import generateToken from "../utils/generateToken.js";
import Result from "./../models/resultModel.js";
import mongoose from "mongoose";

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      password_encrypted: user.password,
      message: "User Successfully login with role: " + user.role,
    });
  } else {
    res.status(401);
    throw new Error("Invalid User email or password ");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExist = await User.findOne({ email });

  if (userExist) {
    res.status(400);
    throw new Error("User Already Exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  if (user) {
    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      password_encrypted: user.password,
      message: "User Successfully created with role: " + user.role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid User Data");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    expires: new Date(0),
  });
  res.status(200).json({ message: " User logout User" });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  };
  res.status(200).json(user);
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error("User Not Found");
  }
});

// @desc    Get all students with their statistics
// @route   GET /api/users/students
// @access  Private/Teacher
const getAllStudents = asyncHandler(async (req, res) => {
  try {
    // Find all users with role 'student'
    const students = await User.find({ role: "student" }).select(
      "-password"
    );

    // Get all results to calculate statistics
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        // Find all results for this student
        const results = await Result.find({ userId: student._id });

        // Calculate statistics
        const examsAttempted = results.length;
        const examsCompleted = results.filter(
          (r) => r.showToStudent === true
        ).length;

        // Calculate average score
        let averageScore = 0;
        if (examsCompleted > 0) {
          const totalPercentage = results
            .filter((r) => r.showToStudent === true)
            .reduce((sum, r) => sum + (r.percentage || 0), 0);
          averageScore = totalPercentage / examsCompleted;
        }

        // Determine status (active if attempted exam in last 30 days)
        let status = "inactive";
        let lastActive = null;

        if (results.length > 0) {
          const sortedResults = results.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          lastActive = sortedResults[0].createdAt;

          const daysSinceLastActive = Math.floor(
            (Date.now() - new Date(lastActive)) / (1000 * 60 * 60 * 24)
          );
          status = daysSinceLastActive <= 30 ? "active" : "inactive";
        }

        return {
          id: student._id,
          name: student.name,
          email: student.email,
          enrollmentDate: student.createdAt,
          examsAttempted,
          examsCompleted,
          averageScore: parseFloat(averageScore.toFixed(2)),
          status,
          lastActive: lastActive || student.createdAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: studentsWithStats.length,
      data: studentsWithStats,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500);
    throw new Error("Failed to fetch students");
  }
});

// @desc    Add a new student (Teacher only)
// @route   POST /api/users/students
// @access  Private/Teacher
const addStudent = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password");
  }

  // Check if student already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  // Create student with role 'student'
  const student = await User.create({
    name,
    email,
    password,
    role: "student",
  });

  if (student) {
    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        _id: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        createdAt: student.createdAt,
      },
    });
  } else {
    res.status(400);
    throw new Error("Failed to create student");
  }
});

export {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getAllStudents,
  addStudent,
};
