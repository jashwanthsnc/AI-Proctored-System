import asyncHandler from "express-async-handler";
import Question from "../models/quesModel.js";

const getQuestionsByExamId = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  console.log("Question Exam id ", examId);

  if (!examId) {
    return res.status(400).json({ error: "examId is missing or invalid" });
  }

  const questions = await Question.find({ examId });
  console.log("Question Exam  ", questions);

  res.status(200).json(questions);
});

const createQuestion = asyncHandler(async (req, res) => {
  const { question, options, examId } = req.body;

  if (!examId) {
    return res.status(400).json({ error: "examId is missing or invalid" });
  }

  const newQuestion = new Question({
    question,
    options,
    examId,
  });

  const createdQuestion = await newQuestion.save();

  if (createdQuestion) {
    res.status(201).json(createdQuestion);
  } else {
    res.status(400);
    throw new Error("Invalid Question Data");
  }
});

// Update a question
const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { question, options } = req.body;

  if (!question || !options || options.length === 0) {
    res.status(400);
    throw new Error("Question and options are required");
  }

  const existingQuestion = await Question.findById(id);

  if (!existingQuestion) {
    res.status(404);
    throw new Error("Question not found");
  }

  existingQuestion.question = question;
  existingQuestion.options = options;

  const updatedQuestion = await existingQuestion.save();

  res.status(200).json({
    success: true,
    message: "Question updated successfully",
    data: updatedQuestion,
  });
});

// Delete a question
const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const question = await Question.findById(id);

  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  await Question.deleteOne({ _id: id });

  res.status(200).json({
    success: true,
    message: "Question deleted successfully",
    id: id,
  });
});

export { getQuestionsByExamId, createQuestion, updateQuestion, deleteQuestion };
