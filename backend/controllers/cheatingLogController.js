import asyncHandler from "express-async-handler";
import CheatingLog from "../models/cheatingLogModel.js";
import Exam from "../models/examModel.js";
import Result from "../models/resultModel.js";

// @desc Save cheating log data
// @route POST /api/users/cheatingLogs
// @access Private
const saveCheatingLog = asyncHandler(async (req, res) => {
  const {
    noFaceCount,
    multipleFaceCount,
    cellPhoneCount,
    prohibitedObjectCount,
    browserLockdownViolations,
    tabSwitchViolations,
    windowBlurViolations,
    examId,
    username,
    email,
    screenshots,
  } = req.body;

  console.log(" [Save Log] Received cheating log data:", {
    examId,
    email,
    username,
    violations: { 
      noFaceCount, 
      multipleFaceCount, 
      cellPhoneCount, 
      prohibitedObjectCount,
      browserLockdownViolations,
      tabSwitchViolations,
      windowBlurViolations
    },
    screenshotCount: screenshots?.length || 0
  });

  // Use findOneAndUpdate with upsert to update existing log or create new one
  // This maintains one log per student-exam combination
  const savedLog = await CheatingLog.findOneAndUpdate(
    { examId, email }, // Find by examId and email (unique per student-exam)
    {
      $set: {
        username, // Always update username in case it changed
      },
      $max: {
        // Use $max to ensure counts never decrease - keeps highest value
        // If new count is higher, it updates; if lower (like 0 from auto-save), keeps existing
        noFaceCount: parseInt(noFaceCount) || 0,
        multipleFaceCount: parseInt(multipleFaceCount) || 0,
        cellPhoneCount: parseInt(cellPhoneCount) || 0,
        prohibitedObjectCount: parseInt(prohibitedObjectCount) || 0,
        browserLockdownViolations: parseInt(browserLockdownViolations) || 0,
        tabSwitchViolations: parseInt(tabSwitchViolations) || 0,
        windowBlurViolations: parseInt(windowBlurViolations) || 0,
      },
      $push: {
        screenshots: { $each: screenshots || [] }
      }
    },
    { 
      upsert: true, // Create if doesn't exist
      new: true, // Return updated document
      runValidators: true // Run schema validators
    }
  );

  const action = savedLog.createdAt.getTime() === savedLog.updatedAt.getTime() ? 'CREATED' : 'UPDATED';
  console.log(` [Save Log] ${action} cheating log:`, {
    id: savedLog._id,
    examId: savedLog.examId,
    email: savedLog.email,
    createdAt: savedLog.createdAt,
    updatedAt: savedLog.updatedAt,
    violations: {
      noFace: savedLog.noFaceCount,
      multiple: savedLog.multipleFaceCount,
      phone: savedLog.cellPhoneCount,
      prohibited: savedLog.prohibitedObjectCount,
      browserLockdown: savedLog.browserLockdownViolations,
      tabSwitch: savedLog.tabSwitchViolations,
      windowBlur: savedLog.windowBlurViolations
    }
  });

  if (savedLog) {
    res.status(201).json(savedLog);
  } else {
    res.status(400);
    throw new Error("Invalid Cheating Log Data");
  }
});

// @desc Get all cheating log data for a specific exam
// @route GET /api/users/cheatingLogs/:examId
// @access Private
const getCheatingLogsByExamId = asyncHandler(async (req, res) => {
  const examId = req.params.examId;
  const cheatingLogs = await CheatingLog.find({ examId });

  res.status(200).json(cheatingLogs);
});

// @desc Get active students (currently taking exams)
// @route GET /api/users/exam/active-students
// @access Private/Teacher
const getActiveStudents = asyncHandler(async (req, res) => {
  try {
    const currentTime = new Date();
    console.log(' [Active Students] Starting query at:', currentTime);
    
    // Find active exams (live now)
    const activeExams = await Exam.find({
      liveDate: { $lte: currentTime },
      deadDate: { $gte: currentTime }
    }).select('examId examName liveDate deadDate duration eligibleStudents');

    console.log(' [Active Students] Found active exams:', activeExams.length);
    activeExams.forEach(exam => {
      console.log(`  - ${exam.examName} (${exam.examId}): ${exam.liveDate} to ${exam.deadDate}`);
    });

    if (!activeExams || activeExams.length === 0) {
      console.log(' [Active Students] No active exams found');
      return res.status(200).json([]);
    }

    const activeStudentData = [];

    // For each active exam, find students who started but haven't submitted
    for (const exam of activeExams) {
      console.log(`\n [Active Students] Processing exam: ${exam.examName} (${exam.examId})`);
      
      // Find cheating logs for this exam (indicates student started)
      const logsForExam = await CheatingLog.find({ 
        examId: exam.examId 
      }).select('email username createdAt updatedAt');

      console.log(`  [Active Students] Found ${logsForExam.length} cheating logs for this exam`);
      logsForExam.forEach(log => {
        console.log(`    - ${log.username} (${log.email}): Last activity ${log.updatedAt}`);
      });

      // Find submitted results for this exam and populate user to get email
      const submittedResults = await Result.find({
        examId: exam.examId
      }).populate('userId', 'email').select('userId');

      console.log(`  [Active Students] Found ${submittedResults.length} submitted results`);

      // Extract emails of students who submitted
      const submittedEmails = submittedResults
        .map(r => r.userId?.email)
        .filter(email => email); // Remove null/undefined

      console.log(`  [Active Students] Submitted emails:`, submittedEmails);

      // Get unique students from logs
      const uniqueStudents = {};
      logsForExam.forEach(log => {
        if (!uniqueStudents[log.email]) {
          uniqueStudents[log.email] = {
            email: log.email,
            username: log.username,
            lastActivity: log.updatedAt
          };
        } else {
          // Keep the most recent activity
          if (log.updatedAt > uniqueStudents[log.email].lastActivity) {
            uniqueStudents[log.email].lastActivity = log.updatedAt;
          }
        }
      });

      console.log(`  [Active Students] Unique students from logs:`, Object.keys(uniqueStudents).length);

      // Build active student list (started but not submitted)
      for (const email in uniqueStudents) {
        const student = uniqueStudents[email];
        
        // Skip if student has already submitted
        if (submittedEmails.includes(email)) {
          console.log(`  [Active Students] Skipping ${email} (already submitted)`);
          continue;
        }
        
        const lastActivityTime = new Date(student.lastActivity);
        const timeSinceActivity = (currentTime - lastActivityTime) / 1000 / 60; // minutes

        console.log(`  [Active Students] ${email} - ${timeSinceActivity.toFixed(2)} minutes since activity`);

        // Consider active if activity within last 15 minutes
        if (timeSinceActivity <= 15) {
          const activeStudent = {
            email: student.email,
            username: student.username,
            examId: exam.examId,
            examName: exam.examName,
            lastActivity: student.lastActivity,
            timeRemaining: calculateTimeRemaining(exam.deadDate),
            status: 'active'
          };
          activeStudentData.push(activeStudent);
          console.log(`  [Active Students] Added ${email} to active list`);
        } else {
          console.log(`  [Active Students] ${email} inactive (>15 min)`);
        }
      }
    }

    console.log(`\n [Active Students] Total active students: ${activeStudentData.length}`);
    console.log('Active students data:', JSON.stringify(activeStudentData, null, 2));

    res.status(200).json(activeStudentData);
  } catch (error) {
    console.error(' [Active Students] Error:', error);
    res.status(500).json({ message: 'Failed to fetch active students' });
  }
});

// @desc Get recent violations (last 30 minutes)
// @route GET /api/users/exam/recent-violations
// @access Private/Teacher
const getRecentViolations = asyncHandler(async (req, res) => {
  try {
    const timeLimit = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
    console.log(' [Recent Violations] Query starting. Time limit:', timeLimit);

    // Find violations updated in the last 30 minutes
    // Only include logs with at least one violation count > 0
    const recentViolations = await CheatingLog.find({
      updatedAt: { $gte: timeLimit },
      $or: [
        { noFaceCount: { $gt: 0 } },
        { multipleFaceCount: { $gt: 0 } },
        { cellPhoneCount: { $gt: 0 } },
        { prohibitedObjectCount: { $gt: 0 } },
        { browserLockdownViolations: { $gt: 0 } },
        { tabSwitchViolations: { $gt: 0 } },
        { windowBlurViolations: { $gt: 0 } }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(50);

    console.log(` [Recent Violations] Found ${recentViolations.length} violations in last 30 minutes`);
    recentViolations.forEach((log, index) => {
      console.log(`  ${index + 1}. ${log.username} (${log.email}) - Updated: ${log.updatedAt}`);
      console.log(`     No Face: ${log.noFaceCount}, Multiple: ${log.multipleFaceCount}, Phone: ${log.cellPhoneCount}, Prohibited: ${log.prohibitedObjectCount}`);
      console.log(`     Tab Switch: ${log.tabSwitchViolations || 0}, Window Blur: ${log.windowBlurViolations || 0}, Browser Lock: ${log.browserLockdownViolations || 0}`);
    });

    // Enrich with exam names
    const violationsWithExamNames = await Promise.all(
      recentViolations.map(async (log) => {
        const exam = await Exam.findOne({ examId: log.examId }).select('examName');
        return {
          _id: log._id,
          username: log.username,
          email: log.email,
          examId: log.examId,
          examName: exam?.examName || 'Unknown Exam',
          noFaceCount: log.noFaceCount,
          multipleFaceCount: log.multipleFaceCount,
          cellPhoneCount: log.cellPhoneCount,
          prohibitedObjectCount: log.prohibitedObjectCount,
          browserLockdownViolations: log.browserLockdownViolations || 0,
          tabSwitchViolations: log.tabSwitchViolations || 0,
          windowBlurViolations: log.windowBlurViolations || 0,
          totalViolations: 
            log.noFaceCount + 
            log.multipleFaceCount + 
            log.cellPhoneCount + 
            log.prohibitedObjectCount +
            (log.browserLockdownViolations || 0) +
            (log.tabSwitchViolations || 0) +
            (log.windowBlurViolations || 0),
          screenshots: log.screenshots,
          lastViolation: log.updatedAt,
          createdAt: log.createdAt
        };
      })
    );

    console.log(` [Recent Violations] Returning ${violationsWithExamNames.length} violations with exam names`);

    res.status(200).json(violationsWithExamNames);
  } catch (error) {
    console.error(' [Recent Violations] Error:', error);
    res.status(500).json({ message: 'Failed to fetch recent violations' });
  }
});

// @desc Get live proctoring statistics
// @route GET /api/users/exam/proctoring-stats
// @access Private/Teacher
const getProctoringStats = asyncHandler(async (req, res) => {
  try {
    const currentTime = new Date();
    const last30Minutes = new Date(Date.now() - 30 * 60 * 1000);

    // Active exams count
    const activeExamsCount = await Exam.countDocuments({
      liveDate: { $lte: currentTime },
      deadDate: { $gte: currentTime }
    });

    // Recent violations count
    const recentViolationsCount = await CheatingLog.countDocuments({
      updatedAt: { $gte: last30Minutes }
    });

    // Active students (unique emails with recent activity)
    const recentLogs = await CheatingLog.find({
      updatedAt: { $gte: last30Minutes }
    }).select('email');

    const uniqueEmails = [...new Set(recentLogs.map(log => log.email))];
    const activeStudentsCount = uniqueEmails.length;

    // Total violations today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const todayViolations = await CheatingLog.aggregate([
      { $match: { createdAt: { $gte: startOfDay } } },
      {
        $group: {
          _id: null,
          totalNoFace: { $sum: '$noFaceCount' },
          totalMultipleFace: { $sum: '$multipleFaceCount' },
          totalCellPhone: { $sum: '$cellPhoneCount' },
          totalProhibitedObject: { $sum: '$prohibitedObjectCount' }
        }
      }
    ]);

    const violationStats = todayViolations[0] || {
      totalNoFace: 0,
      totalMultipleFace: 0,
      totalCellPhone: 0,
      totalProhibitedObject: 0
    };

    res.status(200).json({
      activeExams: activeExamsCount,
      activeStudents: activeStudentsCount,
      recentViolations: recentViolationsCount,
      todayViolations: {
        noFace: violationStats.totalNoFace,
        multipleFace: violationStats.totalMultipleFace,
        cellPhone: violationStats.totalCellPhone,
        prohibitedObject: violationStats.totalProhibitedObject,
        total: violationStats.totalNoFace + violationStats.totalMultipleFace + 
               violationStats.totalCellPhone + violationStats.totalProhibitedObject
      }
    });
  } catch (error) {
    console.error('Error fetching proctoring stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Helper function to calculate time remaining
const calculateTimeRemaining = (deadDate) => {
  const now = new Date();
  const deadline = new Date(deadDate);
  const diffMs = deadline - now;
  
  if (diffMs <= 0) return 'Expired';
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export { 
  saveCheatingLog, 
  getCheatingLogsByExamId,
  getActiveStudents,
  getRecentViolations,
  getProctoringStats
};
