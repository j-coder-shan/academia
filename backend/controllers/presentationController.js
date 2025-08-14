const Presentation = require('../models/presentationModel');
const Course = require('../models/courseModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all presentations for a lecturer
// @route   GET /api/presentations
// @access  Private (Lecturer)
const getPresentations = asyncHandler(async (req, res) => {
    try {
        const { status, course, page = 1, limit = 10 } = req.query;
        const query = { lecturer: req.user._id };

        if (status && status !== '') {
            query.status = status;
        }

        if (course && course !== '') {
            query.course = course;
        }

        const presentations = await Presentation.find(query)
            .populate('course', 'name code students')
            .populate('lecturer', 'name email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Presentation.countDocuments(query);

        // Calculate statistics for each presentation
        const presentationsWithStats = presentations.map(presentation => {
            const stats = presentation.getStatistics();
            return {
                ...presentation.toObject(),
                statistics: stats
            };
        });

        res.json({
            success: true,
            presentations: presentationsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching presentations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching presentations',
            error: error.message
        });
    }
});

// @desc    Get presentations for a student (by enrolled courses)
// @route   GET /api/presentations/student
// @access  Private (Student)
const getStudentPresentations = asyncHandler(async (req, res) => {
    try {
        console.log(`🔍 Fetching ALL presentations for student ID: ${req.user._id}`);
        
        // Get ALL published/active presentations (not just enrolled courses)
        const presentations = await Presentation.find({
            status: { $in: ['published', 'active'] }
        })
        .populate('course', 'name code')
        .populate('lecturer', 'name email')
        .sort({ 'schedule.dueDate': 1 });

        console.log(`📋 Found ${presentations.length} total presentations for student`);

        // Add submission status for each presentation
        const presentationsWithStatus = presentations.map(presentation => {
            const userSubmission = presentation.submissions.find(
                sub => sub.student.toString() === req.user._id.toString()
            );

            return {
                ...presentation.toObject(),
                userSubmission: userSubmission || null,
                submissionStatus: userSubmission ? userSubmission.status : 'not_submitted'
            };
        });

        res.json({
            success: true,
            presentations: presentationsWithStatus
        });
    } catch (error) {
        console.error('❌ Error fetching student presentations:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching presentations',
            error: error.message
        });
    }
});

// @desc    Create new presentation
// @route   POST /api/presentations
// @access  Private (Lecturer)
const createPresentation = asyncHandler(async (req, res) => {
    try {
        const {
            title,
            description,
            course,
            type,
            duration,
            schedule,
            grading,
            requirements,
            groupSettings,
            selectedStudents = [], // Allow lecturer to select specific students
            notificationMode = 'enrolled', // New field for notification mode
            status = 'published'
        } = req.body;

        // Verify course exists and lecturer teaches it (optional check)
        const courseDoc = await Course.findById(course);
        if (!courseDoc) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Create presentation with minimal validation
        const presentation = new Presentation({
            title: title || 'Untitled Presentation',
            description: description || 'No description provided',
            course: course,
            lecturer: req.user._id,
            type: type || 'individual',
            duration: duration || 30,
            selectedStudents: selectedStudents, // Store selected students
            schedule: {
                assignedDate: schedule?.assignedDate ? new Date(schedule.assignedDate) : new Date(),
                dueDate: schedule?.dueDate ? new Date(schedule.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                presentationDate: schedule?.presentationDate ? new Date(schedule.presentationDate) : undefined,
                presentationTime: schedule?.presentationTime
            },
            grading: {
                maxScore: grading?.maxScore || 100,
                method: grading?.method || 'criteria',
                criteria: grading?.criteria || [],
                weightage: grading?.weightage || 20,
                allowLateSubmission: grading?.allowLateSubmission || 'no',
                latePenalty: grading?.latePenalty || 10
            },
            requirements: requirements || {},
            groupSettings: type === 'group' ? groupSettings : undefined,
            status
        });

        await presentation.save();

        // Populate the created presentation with course and students data for notifications
        await presentation.populate('course', 'name code students');
        await presentation.populate('lecturer', 'name email');
        await presentation.populate('selectedStudents', 'name email studentId');

        // Send notifications based on notification mode
        if (status === 'published' || status === 'active') {
            await sendPresentationNotifications(presentation, 'created', notificationMode);
        }

        res.status(201).json({
            success: true,
            message: 'Presentation created successfully',
            presentation: presentation.toObject()
        });

    } catch (error) {
        console.error('Error creating presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating presentation',
            error: error.message
        });
    }
});

// @desc    Update presentation
// @route   PUT /api/presentations/:id
// @access  Private (Lecturer)
const updatePresentation = asyncHandler(async (req, res) => {
    try {
        const presentation = await Presentation.findById(req.params.id);

        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found'
            });
        }

        // Check if user is the lecturer of this presentation
        if (presentation.lecturer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own presentations'
            });
        }

        // Update presentation
        Object.assign(presentation, req.body);
        await presentation.save();

        await presentation.populate('course', 'name code students');
        await presentation.populate('lecturer', 'name email');

        // Send update notifications to enrolled students
        if (presentation.status === 'published' || presentation.status === 'active') {
            await sendPresentationNotifications(presentation, 'updated', 'enrolled');
        }

        res.json({
            success: true,
            message: 'Presentation updated successfully',
            presentation: presentation.toObject()
        });

    } catch (error) {
        console.error('Error updating presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating presentation',
            error: error.message
        });
    }
});

// @desc    Cancel presentation
// @route   PUT /api/presentations/:id/cancel
// @access  Private (Lecturer)
const cancelPresentation = asyncHandler(async (req, res) => {
    try {
        const presentation = await Presentation.findById(req.params.id);

        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found'
            });
        }

        // Check if user is the lecturer of this presentation
        if (presentation.lecturer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only cancel your own presentations'
            });
        }

        // Update status to cancelled
        presentation.status = 'cancelled';
        await presentation.save();

        await presentation.populate('course', 'name code students');

        // Send cancellation notifications to enrolled students
        await sendCancellationNotifications(presentation);

        res.json({
            success: true,
            message: 'Presentation cancelled successfully',
            presentation: presentation.toObject()
        });

    } catch (error) {
        console.error('Error cancelling presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling presentation',
            error: error.message
        });
    }
});

// @desc    Delete presentation
// @route   DELETE /api/presentations/:id
// @access  Private (Lecturer)
const deletePresentation = asyncHandler(async (req, res) => {
    try {
        const presentation = await Presentation.findById(req.params.id);

        if (!presentation) {
            return res.status(404).json({
                success: false,
                message: 'Presentation not found'
            });
        }

        // Check if user is the lecturer of this presentation
        if (presentation.lecturer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own presentations'
            });
        }

        // Check if there are submissions
        if (presentation.submissions && presentation.submissions.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete presentation with existing submissions. Cancel it instead.'
            });
        }

        await Presentation.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Presentation deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting presentation:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting presentation',
            error: error.message
        });
    }
});

// @desc    Get presentation statistics
// @route   GET /api/presentations/stats
// @access  Private (Lecturer)
const getPresentationStats = asyncHandler(async (req, res) => {
    try {
        const lecturerId = req.user._id;

        const stats = await Presentation.aggregate([
            { $match: { lecturer: lecturerId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                        }
                    },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    },
                    pendingReview: {
                        $sum: {
                            $size: {
                                $filter: {
                                    input: '$submissions',
                                    cond: { $eq: ['$$this.status', 'submitted'] }
                                }
                            }
                        }
                    },
                    averageScore: {
                        $avg: {
                            $avg: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$submissions',
                                            cond: { $ne: ['$$this.grade.totalScore', null] }
                                        }
                                    },
                                    as: 'submission',
                                    in: '$$submission.grade.totalScore'
                                }
                            }
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            total: 0,
            active: 0,
            completed: 0,
            pendingReview: 0,
            averageScore: 0
        };

        res.json({
            success: true,
            stats: {
                totalPresentations: result.total,
                activePresentations: result.active,
                completedPresentations: result.completed,
                pendingReviews: result.pendingReview,
                averageScore: Math.round((result.averageScore || 0) * 100) / 100
            }
        });

    } catch (error) {
        console.error('Error fetching presentation stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Helper function to send notifications
const sendPresentationNotifications = async (presentation, action, notificationMode = 'enrolled') => {
    try {
        const notificationType = action === 'created' ? 'presentation_created' : 'presentation_updated';
        const actionText = action === 'created' ? 'created' : 'updated';
        
        let targetStudents = [];
        let logMessage = '';
        
        if (notificationMode === 'all') {
            // Send to ALL students in the system
            targetStudents = await User.find({ role: 'student' }).select('_id name email');
            logMessage = `📢 Sending notifications to ALL students in the system for presentation: ${presentation.title}`;
        } else if (notificationMode === 'selected') {
            // Send to specific selected students
            targetStudents = await User.find({ 
                _id: { $in: presentation.selectedStudents || [] }, 
                role: 'student' 
            }).select('_id name email');
            logMessage = `📢 Sending notifications to selected students for presentation: ${presentation.title}`;
        } else {
            // Default: Send to enrolled students only
            if (presentation.course && presentation.course.students) {
                targetStudents = await User.find({ 
                    _id: { $in: presentation.course.students }, 
                    role: 'student' 
                }).select('_id name email');
            }
            logMessage = `📢 Sending notifications to enrolled students for presentation: ${presentation.title}`;
        }
        
        console.log(logMessage);
        
        if (targetStudents.length === 0) {
            console.log('❌ No students found for notification');
            return;
        }

        console.log(`📧 Sending notification to ${targetStudents.length} students`);

        const notifications = targetStudents.map(student => ({
            recipient: student._id,
            sender: presentation.lecturer._id || presentation.lecturer,
            type: notificationType,
            title: `New Presentation: ${presentation.title}`,
            message: `🎯 You have a new presentation assigned!\n\n` +
                    `📝 Title: ${presentation.title}\n` +
                    `📚 Course: ${presentation.course?.name || 'Course'} (${presentation.course?.code || ''})\n` +
                    `👨‍🏫 Lecturer: ${presentation.lecturer?.name || 'Lecturer'}\n` +
                    `📅 Due Date: ${presentation.schedule?.dueDate ? new Date(presentation.schedule.dueDate).toLocaleDateString() : 'TBD'}\n` +
                    `⏱️ Duration: ${presentation.duration || 30} minutes\n` +
                    `📋 Type: ${presentation.type || 'Individual'}\n\n` +
                    `${presentation.description ? `📖 Description: ${presentation.description}\n\n` : ''}` +
                    `Please check your presentations dashboard for more details.`,
            data: {
                presentationId: presentation._id,
                courseId: presentation.course._id || presentation.course,
                url: `/student/presentations`,
                actionRequired: true
            },
            priority: 'high'
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            
            // Update presentation notifications
            presentation.notifications.push({
                type: actionText,
                recipients: targetStudents.map(s => s._id),
                sentAt: new Date()
            });
            
            await presentation.save();
            
            console.log(`✅ Sent ${notifications.length} notifications to students for presentation: ${presentation.title}`);
        }

    } catch (error) {
        console.error('❌ Error sending notifications:', error);
    }
};

// Helper function to send cancellation notifications
const sendCancellationNotifications = async (presentation) => {
    try {
        if (!presentation.course || !presentation.course.students) {
            return;
        }

        const notifications = presentation.course.students.map(studentId => ({
            recipient: studentId,
            sender: presentation.lecturer._id,
            type: 'presentation_updated',
            title: 'Presentation Cancelled',
            message: `The presentation "${presentation.title}" for course ${presentation.course.name} has been cancelled.`,
            data: {
                presentationId: presentation._id,
                courseId: presentation.course._id,
                url: `/student/presentations`,
                actionRequired: false
            },
            priority: 'high'
        }));

        await Notification.insertMany(notifications);

    } catch (error) {
        console.error('Error sending cancellation notifications:', error);
    }
};

// @desc    Get enrolled students for a course (for student selection in presentations)
// @route   GET /api/presentations/course/:courseId/students
// @access  Private (Lecturer)
const getCourseStudents = asyncHandler(async (req, res) => {
    try {
        const { courseId } = req.params;
        
        const course = await Course.findById(courseId)
            .populate('students', 'name email studentId')
            .select('name code students');
            
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            course: {
                _id: course._id,
                name: course.name,
                code: course.code
            },
            students: course.students || []
        });
        
    } catch (error) {
        console.error('Error fetching course students:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching course students',
            error: error.message
        });
    }
});

module.exports = {
    getPresentations,
    getStudentPresentations,
    createPresentation,
    updatePresentation,
    cancelPresentation,
    deletePresentation,
    getPresentationStats,
    getCourseStudents
};
