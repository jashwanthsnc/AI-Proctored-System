import mongoose from "mongoose";

// Define a schema for the cheating log
const cheatingLogSchema = new mongoose.Schema(
  {
    noFaceCount: { type: Number, default: 0 },
    multipleFaceCount: { type: Number, default: 0 },
    cellPhoneCount: { type: Number, default: 0 },
    prohibitedObjectCount: { type: Number, default: 0 },
    browserLockdownViolations: { type: Number, default: 0 },
    tabSwitchViolations: { type: Number, default: 0 },
    windowBlurViolations: { type: Number, default: 0 },
    gazeViolationCount: { type: Number, default: 0 },
    externalDisplayCount: { type: Number, default: 0 },
    audioViolationCount: { type: Number, default: 0 },

    examId: { type: String, required: true },
    email: { type: String, required: true },
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    screenshots: [
      {
        url: { type: String, required: true },
        type: {
          type: String,
          enum: [
            "noFace", "multipleFace", "cellPhone", "prohibitedObject",
            "periodic", "gazeViolation", "tabSwitch", "lockdown",
            "audioViolation", "externalDisplay",
          ],
          required: true,
        },
        detectedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
cheatingLogSchema.index({ examId: 1, email: 1 }, { unique: true });
cheatingLogSchema.index({ examId: 1 });
cheatingLogSchema.index({ updatedAt: -1 });
cheatingLogSchema.index({ email: 1 });

const CheatingLog = mongoose.model("CheatingLog", cheatingLogSchema);

export default CheatingLog;
