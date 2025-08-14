const mongoose = require('mongoose');

// Define schedule schema for individual schedule items
const scheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    type: {
        type: String,
        default: 'lecture',
        enum: ['lecture', 'lab', 'tutorial', 'seminar']
    }
}, { _id: true });

// Define module schema
const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    order: Number,
    content: String,
    resources: [String]
}, { _id: true });

// Define assignment schema
const assignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    points: Number,
    type: { type: String, enum: ['homework', 'quiz', 'project', 'exam'], default: 'homework' }
}, { _id: true });

// Define resource schema
const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'video', 'link', 'document'], default: 'document' },
    url: String,
    description: String
}, { _id: true });

// Define announcement schema
const announcementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

// Main course schema that matches your database structure
const courseSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true
    },
    description: { 
        type: String, 
        required: true,
        trim: true
    },
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        trim: true
    },
    category: { 
        type: String, 
        required: true 
    },
    level: { 
        type: String, 
        default: 'Beginner',
        enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    credits: { 
        type: Number, 
        default: 3,
        min: 1,
        max: 6
    },
    
    // 🔧 ADD: Duration field from your database
    duration: {
        weeks: { type: Number, default: 16 },
        hoursPerWeek: { type: Number, default: 3 }
    },
    
    lecturer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    lecturerName: {
        type: String
    },
    
    // 🔧 FIX: Use String array to store student IDs
    students: [{ 
        type: String
    }],
    
    maxStudents: { 
        type: Number, 
        default: 50,
        min: 1
    },
    
    // 🔧 ADD: Additional fields from your database
    prerequisites: [String],
    syllabus: { type: String, default: '' },
    objectives: [String],
    
    // 🔧 FIX: Schedule as array of objects
    schedule: [scheduleSchema],
    
    status: { 
        type: String, 
        default: 'active',
        enum: ['active', 'inactive', 'completed', 'cancelled']
    },
    
    startDate: { 
        type: Date, 
        default: Date.now 
    },
    endDate: {
        type: Date
    },
    
    // 🔧 ADD: Enrollment dates
    enrollmentStartDate: {
        type: Date,
        default: Date.now
    },
    enrollmentEndDate: {
        type: Date
    },
    
    // 🔧 ADD: Additional fields
    thumbnail: { type: String, default: '' },
    tags: [String],
    
    // 🔧 FIX: Updated grading schema
    grading: {
        assignments: { 
            type: Number, 
            default: 30,
            min: 0,
            max: 100
        },
        midterm: { 
            type: Number, 
            default: 25,
            min: 0,
            max: 100
        },
        final: { 
            type: Number, 
            default: 35,
            min: 0,
            max: 100
        },
        participation: { 
            type: Number, 
            default: 10,
            min: 0,
            max: 100
        }
    },
    
    // 🔧 ADD: Course settings
    settings: {
        allowSelfEnrollment: { type: Boolean, default: false },
        requireApproval: { type: Boolean, default: true },
        showGrades: { type: Boolean, default: true },
        allowDiscussions: { type: Boolean, default: true }
    },
    
    // 🔧 ADD: Course content
    modules: [moduleSchema],
    assignments: [assignmentSchema],
    resources: [resourceSchema],
    announcements: [announcementSchema]
    
}, {
    timestamps: true
});

// 🔧 ENHANCED: Pre-save middleware to handle data processing
courseSchema.pre('save', function(next) {
    try {
        // Process grading
        const grading = this.grading;
        if (grading) {
            const total = grading.assignments + grading.midterm + grading.final + (grading.participation || 0);
            if (total !== 100) {
                console.log('⚠️ Grading percentages do not add up to 100%:', total);
            }
        }
        
        // Process code
        if (this.code) {
            this.code = this.code.toUpperCase().replace(/\s+/g, '');
        }
        
        // Process credits
        if (this.credits) {
            this.credits = parseInt(this.credits);
        }
        
        // Ensure students array exists
        if (!this.students) {
            this.students = [];
        }
        
        // Set enrollment end date if not provided
        if (this.startDate && !this.enrollmentEndDate) {
            this.enrollmentEndDate = new Date(this.startDate.getTime());
        }
        
        // Set course end date if not provided
        if (this.startDate && !this.endDate && this.duration && this.duration.weeks) {
            this.endDate = new Date(this.startDate.getTime() + (this.duration.weeks * 7 * 24 * 60 * 60 * 1000));
        }
        
        console.log('CourseModel - Pre-save processed values:', {
            code: this.code,
            credits: this.credits,
            startDate: this.startDate,
            endDate: this.endDate,
            studentsCount: this.students ? this.students.length : 0,
            scheduleCount: this.schedule ? this.schedule.length : 0
        });
        
        next();
    } catch (error) {
        console.error('💥 Pre-save error:', error);
        next(error);
    }
});

// 🔧 ENHANCED: Schema methods
courseSchema.methods.getEnrolledCount = function() {
    return this.students ? this.students.length : 0;
};

courseSchema.methods.isStudentEnrolled = function(studentId) {
    return this.students && this.students.includes(studentId);
};

courseSchema.methods.addStudent = function(studentId) {
    if (!this.students) {
        this.students = [];
    }
    
    if (!this.students.includes(studentId)) {
        this.students.push(studentId);
        return true;
    }
    return false; // Already enrolled
};

courseSchema.methods.removeStudent = function(studentId) {
    if (this.students) {
        const index = this.students.indexOf(studentId);
        if (index > -1) {
            this.students.splice(index, 1);
            return true;
        }
    }
    return false; // Not enrolled
};

courseSchema.methods.canEnroll = function() {
    const now = new Date();
    const enrollmentOpen = !this.enrollmentStartDate || now >= this.enrollmentStartDate;
    const enrollmentClosed = this.enrollmentEndDate && now > this.enrollmentEndDate;
    const hasSpace = !this.maxStudents || this.getEnrolledCount() < this.maxStudents;
    const isActive = this.status === 'active';
    
    return enrollmentOpen && !enrollmentClosed && hasSpace && isActive;
};

courseSchema.methods.addAnnouncement = function(title, content, priority = 'medium') {
    this.announcements.push({
        title: title,
        content: content,
        priority: priority,
        createdAt: new Date()
    });
};

courseSchema.methods.addAssignment = function(assignmentData) {
    this.assignments.push(assignmentData);
};

courseSchema.methods.addResource = function(resourceData) {
    this.resources.push(resourceData);
};

// Add indexes for better performance
courseSchema.index({ code: 1 });
courseSchema.index({ lecturer: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ students: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ startDate: 1 });
courseSchema.index({ 'settings.allowSelfEnrollment': 1 });

module.exports = mongoose.model('Course', courseSchema);