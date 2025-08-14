const mongoose = require('mongoose');

// Grading Criteria Schema
const gradingCriteriaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    weight: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    description: {
        type: String,
        trim: true
    }
});

// Group Schema for group presentations
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    members: [{
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    maxMembers: {
        type: Number,
        required: true,
        min: 2
    },
    leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Submission Schema
const submissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    files: [{
        filename: String,
        originalName: String,
        size: Number,
        path: String,
        mimetype: String
    }],
    comments: {
        type: String,
        trim: true
    },
    grade: {
        criteriaScores: [{
            criteriaId: String,
            score: Number
        }],
        totalScore: {
            type: Number,
            min: 0
        },
        feedback: {
            type: String,
            trim: true
        },
        gradedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        gradedAt: Date
    },
    status: {
        type: String,
        enum: ['pending', 'submitted', 'graded', 'late'],
        default: 'pending'
    }
});

// Main Presentation Schema
const presentationSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    lecturer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['individual', 'group'],
        default: 'individual'
    },
    duration: {
        type: Number,
        default: 30
    },
    // Added selected students field for manual student selection
    selectedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    schedule: {
        assignedDate: {
            type: Date,
            default: Date.now
        },
        dueDate: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        },
        presentationDate: Date,
        presentationTime: String
    },
    grading: {
        maxScore: {
            type: Number,
            default: 100
        },
        method: {
            type: String,
            enum: ['criteria', 'holistic', 'peer', 'self'],
            default: 'criteria'
        },
        criteria: [gradingCriteriaSchema],
        weightage: {
            type: Number,
            min: 0,
            max: 100,
            default: 20
        },
        allowLateSubmission: {
            type: String,
            enum: ['no', 'penalty', 'yes'],
            default: 'no'
        },
        latePenalty: {
            type: Number,
            min: 0,
            max: 100,
            default: 10
        }
    },
    requirements: {
        format: {
            type: String,
            trim: true
        },
        minSlides: Number,
        maxSlides: Number,
        submissionFormat: {
            type: String,
            enum: ['pptx', 'pdf', 'both', 'video', 'live'],
            default: 'pptx'
        },
        maxFileSize: {
            type: Number,
            default: 50 // MB
        },
        resources: {
            type: String,
            trim: true
        }
    },
    groups: [groupSchema],
    groupSettings: {
        groupSize: Number,
        formation: {
            type: String,
            enum: ['student-choice', 'instructor-assigned', 'random'],
            default: 'student-choice'
        },
        allowSelfSelection: {
            type: Boolean,
            default: true
        }
    },
    submissions: [submissionSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'active', 'completed', 'cancelled'],
        default: 'draft'
    },
    notifications: [{
        type: {
            type: String,
            enum: ['created', 'updated', 'reminder', 'due_soon', 'overdue']
        },
        sentAt: {
            type: Date,
            default: Date.now
        },
        recipients: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
    }],
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        submissionRate: {
            type: Number,
            default: 0
        },
        averageScore: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
presentationSchema.index({ course: 1, status: 1 });
presentationSchema.index({ lecturer: 1, status: 1 });
presentationSchema.index({ 'schedule.dueDate': 1 });
presentationSchema.index({ createdAt: -1 });

// Virtual for enrolled students count
presentationSchema.virtual('enrolledStudentsCount', {
    ref: 'Course',
    localField: 'course',
    foreignField: '_id',
    count: true
});

// Virtual for submission count
presentationSchema.virtual('submissionCount').get(function() {
    return this.submissions ? this.submissions.length : 0;
});

// Virtual for pending submissions count
presentationSchema.virtual('pendingSubmissionsCount').get(function() {
    return this.submissions ? this.submissions.filter(sub => sub.status === 'pending').length : 0;
});

// Virtual for graded submissions count
presentationSchema.virtual('gradedSubmissionsCount').get(function() {
    return this.submissions ? this.submissions.filter(sub => sub.status === 'graded').length : 0;
});

// Pre-save middleware (simplified without validations)
presentationSchema.pre('save', function(next) {
    // Just proceed without validations
    next();
});

// Method to check if presentation is overdue
presentationSchema.methods.isOverdue = function() {
    return new Date() > this.schedule.dueDate && this.status === 'active';
};

// Method to get presentation statistics
presentationSchema.methods.getStatistics = function() {
    const totalSubmissions = this.submissions.length;
    const gradedSubmissions = this.submissions.filter(sub => sub.status === 'graded').length;
    const averageScore = gradedSubmissions > 0 
        ? this.submissions
            .filter(sub => sub.grade && sub.grade.totalScore !== undefined)
            .reduce((sum, sub) => sum + sub.grade.totalScore, 0) / gradedSubmissions
        : 0;

    return {
        totalSubmissions,
        gradedSubmissions,
        pendingSubmissions: totalSubmissions - gradedSubmissions,
        averageScore: Math.round(averageScore * 100) / 100,
        submissionRate: totalSubmissions > 0 ? (gradedSubmissions / totalSubmissions) * 100 : 0
    };
};

// Static method to get presentations by lecturer
presentationSchema.statics.findByLecturer = function(lecturerId, status = null) {
    const query = { lecturer: lecturerId };
    if (status) {
        query.status = status;
    }
    return this.find(query)
        .populate('course', 'name code')
        .populate('lecturer', 'name email')
        .sort({ createdAt: -1 });
};

// Static method to get presentations by course
presentationSchema.statics.findByCourse = function(courseId) {
    return this.find({ course: courseId, status: { $ne: 'draft' } })
        .populate('lecturer', 'name email')
        .sort({ 'schedule.dueDate': 1 });
};

module.exports = mongoose.model('Presentation', presentationSchema);
