import CodingQuestion from "../models/codingQuestionModel.js";
import asyncHandler from "express-async-handler";

// @desc    Submit a coding answer
// @route   POST /api/coding/submit
// @access  Private (Student)
const submitCodingAnswer = asyncHandler(async (req, res) => {
  const { questionId, code, language } = req.body;

  if (!code || !language || !questionId) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Find the existing question
  const question = await CodingQuestion.findById(questionId);
  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  // Update the question with the submitted answer
  question.submittedAnswer = {
    code,
    language,
    status: "pending", // Initial status
    executionTime: 0, // Will be updated after execution
  };

  // Save the updated question
  const updatedQuestion = await question.save();

  res.status(200).json({
    success: true,
    data: updatedQuestion,
  });
});

// @desc    Create a new coding question
// @route   POST /api/coding/question
// @access  Private (Teacher)
const createCodingQuestion = asyncHandler(async (req, res) => {
  const { question, description, examId, difficulty, timeLimit, points, testCases } = req.body;
  console.log("Received coding question data:", {
    question,
    description,
    examId,
    difficulty,
    timeLimit,
    points,
    testCases,
  });

  if (!question || !description || !examId) {
    const missingFields = [];
    if (!question) missingFields.push("question");
    if (!description) missingFields.push("description");
    if (!examId) missingFields.push("examId");

    res.status(400);
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  // Validate test cases
  if (!testCases || testCases.length === 0) {
    res.status(400);
    throw new Error("At least one test case is required");
  }

  // Validate each test case
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (!tc.input || !tc.expectedOutput) {
      res.status(400);
      throw new Error(`Test case #${i + 1} must have both input and expected output`);
    }
  }

  try {
    // Check if a question already exists for this exam
    const existingQuestion = await CodingQuestion.findOne({
      examId: examId.toString(),
    });
    console.log("Existing question check:", existingQuestion);

    if (existingQuestion) {
      res.status(400);
      throw new Error(`A coding question already exists for exam: ${examId}`);
    }

    const newQuestion = await CodingQuestion.create({
      question,
      description,
      examId: examId.toString(),
      difficulty: difficulty || 'medium',
      timeLimit: timeLimit || 30,
      points: points || 100,
      testCases: testCases || [],
      teacher: req.user._id,
    });

    console.log("Created new question:", newQuestion);

    res.status(201).json({
      success: true,
      data: newQuestion,
    });
  } catch (error) {
    console.error("Error creating coding question:", error);
    res.status(500).json({
      success: false,
      message: error.message,
      details: error.stack,
    });
  }
});

// @desc    Get all coding questions
// @route   GET /api/coding/questions
// @access  Private
const getCodingQuestions = asyncHandler(async (req, res) => {
  const questions = await CodingQuestion.find()
    .select("-submittedAnswer") // Don't send other submissions
    .populate("teacher", "name email");

  res.status(200).json({
    success: true,
    count: questions.length,
    data: questions,
  });
});

// @desc    Get a single coding question
// @route   GET /api/coding/questions/:id
// @access  Private
const getCodingQuestion = asyncHandler(async (req, res) => {
  const question = await CodingQuestion.findById(req.params.id).populate(
    "teacher",
    "name email"
  );

  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  res.status(200).json({
    success: true,
    data: question,
  });
});

// @desc    Get coding questions by exam ID
// @route   GET /api/coding/questions/exam/:examId
// @access  Private
const getCodingQuestionsByExamId = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  console.log("Fetching questions for examId:", examId);

  if (!examId) {
    res.status(400);
    throw new Error("Exam ID is required");
  }

  try {
    const questions = await CodingQuestion.find({
      examId: examId.toString(),
    });
    console.log("Found questions:", questions);

    // Filter test cases based on user role
    const processedQuestions = questions.map(question => {
      const questionObj = question.toObject();
      
      // If user is a student, only show sample test cases
      if (req.user && req.user.role === 'student') {
        questionObj.testCases = questionObj.testCases ? 
          questionObj.testCases.filter(tc => tc.isSample === true) : [];
      }
      
      return questionObj;
    });

    res.status(200).json({
      success: true,
      count: processedQuestions.length,
      data: processedQuestions,
    });
  } catch (error) {
    console.error("Error fetching coding questions:", error);
    res.status(500);
    throw new Error("Error fetching coding questions");
  }
});

// @desc    Update a coding question
// @route   PUT /api/coding/question/:id
// @access  Private (teacher)
const updateCodingQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, description, difficulty, timeLimit, points, testCases } = req.body;

  if (!question || !description) {
    res.status(400);
    throw new Error("Question and description are required");
  }

  // Validate test cases if provided
  if (testCases && testCases.length > 0) {
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (!tc.input || !tc.expectedOutput) {
        res.status(400);
        throw new Error(`Test case #${i + 1} must have both input and expected output`);
      }
    }
  }

  const existingQuestion = await CodingQuestion.findById(id);

  if (!existingQuestion) {
    res.status(404);
    throw new Error("Coding question not found");
  }

  existingQuestion.question = question;
  existingQuestion.description = description;
  existingQuestion.difficulty = difficulty;
  existingQuestion.timeLimit = timeLimit;
  existingQuestion.points = points;
  if (testCases) {
    existingQuestion.testCases = testCases;
  }

  const updatedQuestion = await existingQuestion.save();

  res.status(200).json({
    success: true,
    message: "Coding question updated successfully",
    data: updatedQuestion,
  });
});

// @desc    Delete a coding question
// @route   DELETE /api/coding/question/:id
// @access  Private (teacher)
const deleteCodingQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await CodingQuestion.findById(id);

  if (!question) {
    res.status(404);
    throw new Error("Coding question not found");
  }

  await CodingQuestion.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Coding question deleted successfully",
    id: id,
  });
});

export {
  submitCodingAnswer,
  createCodingQuestion,
  getCodingQuestions,
  getCodingQuestion,
  getCodingQuestionsByExamId,
  updateCodingQuestion,
  deleteCodingQuestion,
};
