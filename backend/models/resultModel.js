import mongoose from "mongoose";

const resultSchema = mongoose.Schema(
  {
    examId: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: {
      type: Map,
      of: String,
      required: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    showToStudent: {
      type: Boolean,
      default: false,
    },
    codingMarks: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: "",
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    gradedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
resultSchema.index({ examId: 1 });
resultSchema.index({ userId: 1 });
resultSchema.index({ examId: 1, userId: 1 }, { unique: true });
resultSchema.index({ showToStudent: 1 });
resultSchema.index({ createdAt: -1 });

const Result = mongoose.model("Result", resultSchema);
export default Result;
