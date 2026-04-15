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
    // Optional metadata fields
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    passingScore: {
      type: Number,
      default: 60,
    },
    marksPerQuestion: {
      type: Number,
      default: 1,
    },
    negativeMarking: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    allowReview: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
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

// Indexes for query performance
examSchema.index({ teacher: 1, liveDate: -1 });
examSchema.index({ liveDate: 1, deadDate: 1 });
examSchema.index({ eligibleStudents: 1 });

const Exam = mongoose.model("Exam", examSchema);

export default Exam;
