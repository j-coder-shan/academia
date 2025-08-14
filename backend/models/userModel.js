const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'lecturer', 'admin'],
        default: 'student'
    },
    academicInfo: {
        employeeId: {
            type: String,
            sparse: true // Allows multiple null values
        },
        studentId: {
            type: String,
            sparse: true
        },
        department: {
            type: String,
            default: 'General'
        },
        semester: {
            type: Number,
            min: 1,
            max: 8
        }
    },
    profileInfo: {
        avatar: {
            type: String,
            default: ''
        },
        bio: {
            type: String,
            default: ''
        },
        phone: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true
});

// Add indexes
userSchema.index({ email: 1 });
userSchema.index({ 'academicInfo.employeeId': 1 });
userSchema.index({ 'academicInfo.studentId': 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);