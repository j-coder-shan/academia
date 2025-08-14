const mongoose = require('mongoose');

const rubricCriteriaSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  maxPoints: {
    type: Number,
    required: true,
    min: 0,
  },
  levels: [{
    name: String,
    description: String,
    points: Number,
  }],
});

const evaluationSchema = mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Course.assignments', // Reference to assignment within course
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Course',
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    submission: {
      content: {
        type: String,
        required: true,
      },
      attachments: [{
        filename: String,
        url: String,
        size: Number,
        mimeType: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      submittedAt: {
        type: Date,
        required: true,
      },
      isLate: {
        type: Boolean,
        default: false,
      },
      daysLate: {
        type: Number,
        default: 0,
      },
    },
    grading: {
      totalPoints: {
        type: Number,
        required: true,
      },
      earnedPoints: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0,
      },
      letterGrade: {
        type: String,
        enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'],
      },
      rubricScores: [{
        criteriaId: mongoose.Schema.Types.ObjectId,
        points: Number,
        levelSelected: String,
        comments: String,
      }],
    },
    feedback: {
      overall: {
        type: String,
        default: '',
      },
      strengths: [{
        type: String,
      }],
      improvements: [{
        type: String,
      }],
      specific: [{
        lineNumber: Number,
        comment: String,
        type: {
          type: String,
          enum: ['suggestion', 'error', 'praise', 'question'],
          default: 'suggestion',
        },
      }],
    },
    rubric: [rubricCriteriaSchema],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'returned', 'resubmitted'],
      default: 'pending',
    },
    timeline: [{
      action: {
        type: String,
        enum: ['submitted', 'started_grading', 'graded', 'returned', 'resubmitted'],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      notes: String,
    }],
    plagiarismCheck: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },
      sources: [{
        url: String,
        similarity: Number,
        matchedText: String,
      }],
      checkedAt: Date,
      tool: String,
    },
    analytics: {
      timeSpentGrading: {
        type: Number, // in minutes
        default: 0,
      },
      numberOfRevisions: {
        type: Number,
        default: 0,
      },
      averageResponseTime: {
        type: Number, // in hours
        default: 0,
      },
    },
    flags: [{
      type: {
        type: String,
        enum: ['plagiarism', 'late_submission', 'quality_concern', 'exceptional_work'],
      },
      description: String,
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      flaggedAt: {
        type: Date,
        default: Date.now,
      },
      resolved: {
        type: Boolean,
        default: false,
      },
    }],
    settings: {
      allowResubmission: {
        type: Boolean,
        default: false,
      },
      resubmissionDeadline: Date,
      showGradeToStudent: {
        type: Boolean,
        default: true,
      },
      showFeedbackToStudent: {
        type: Boolean,
        default: true,
      },
      notifyStudent: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
evaluationSchema.index({ course: 1, assignment: 1 });
evaluationSchema.index({ student: 1 });
evaluationSchema.index({ evaluator: 1 });
evaluationSchema.index({ status: 1 });
evaluationSchema.index({ 'submission.submittedAt': 1 });

// Virtual for grade calculation
evaluationSchema.virtual('calculatedGrade').get(function () {
  if (this.grading.totalPoints === 0) return 0;
  return (this.grading.earnedPoints / this.grading.totalPoints) * 100;
});

// Method to calculate letter grade based on percentage
evaluationSchema.methods.calculateLetterGrade = function () {
  const percentage = this.calculatedGrade;
  
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 60) return 'D';
  return 'F';
};

// Method to add timeline entry
evaluationSchema.methods.addTimelineEntry = function (action, user, notes = '') {
  this.timeline.push({
    action,
    timestamp: new Date(),
    user,
    notes,
  });
};

// Method to check if submission is late
evaluationSchema.methods.checkLateness = function (dueDate) {
  const submissionDate = new Date(this.submission.submittedAt);
  const due = new Date(dueDate);
  
  if (submissionDate > due) {
    this.submission.isLate = true;
    this.submission.daysLate = Math.ceil((submissionDate - due) / (1000 * 60 * 60 * 24));
  }
};

// Pre-save middleware to calculate grades and update status
evaluationSchema.pre('save', function (next) {
  // Calculate percentage
  if (this.grading.totalPoints > 0) {
    this.grading.percentage = (this.grading.earnedPoints / this.grading.totalPoints) * 100;
    this.grading.letterGrade = this.calculateLetterGrade();
  }
  
  // Update status based on grading completion
  if (this.grading.earnedPoints > 0 && this.status === 'pending') {
    this.status = 'completed';
  }
  
  next();
});

// Static method to find evaluations by course
evaluationSchema.statics.findByCourse = function (courseId) {
  return this.find({ course: courseId })
    .populate('student', 'name email')
    .populate('evaluator', 'name email')
    .sort({ 'submission.submittedAt': -1 });
};

// Static method to find pending evaluations for a lecturer
evaluationSchema.statics.findPendingByEvaluator = function (evaluatorId) {
  return this.find({ 
    evaluator: evaluatorId, 
    status: { $in: ['pending', 'in_progress'] } 
  })
    .populate('student', 'name email')
    .populate('course', 'title code')
    .sort({ 'submission.submittedAt': 1 });
};

// Static method to get evaluation statistics
evaluationSchema.statics.getStatistics = function (filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalEvaluations: { $sum: 1 },
        averageGrade: { $avg: '$grading.percentage' },
        completedEvaluations: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingEvaluations: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        lateSubmissions: {
          $sum: { $cond: ['$submission.isLate', 1, 0] }
        },
      }
    }
  ]);
};

module.exports = mongoose.model('Evaluation', evaluationSchema);
