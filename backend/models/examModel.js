import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const examSchema = mongoose.Schema(
  {
    examName: {
      type: String,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    liveDate: {
      type: Date,
      required: true,
    },
    deadDate: {
      type: Date,
      required: true,
    },
    // Define examId field with UUID generation
    examId: {
      type: String,
      default: uuidv4, // Generate a new UUID for each document
      unique: true, // Ensure uniqueness of UUIDs
    },
    // Teacher who created the exam
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Array of student IDs who are eligible to take this exam
    eligibleStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
