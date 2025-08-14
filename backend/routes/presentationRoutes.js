const express = require('express');
const router = express.Router();
const {
    getPresentations,
    getStudentPresentations,
    createPresentation,
    updatePresentation,
    cancelPresentation,
    deletePresentation,
    getPresentationStats,
    getCourseStudents
} = require('../controllers/presentationController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// @route   GET /api/presentations/stats
// @desc    Get presentation statistics for lecturer
// @access  Private (Lecturer)
router.get('/stats', protect, restrictTo('lecturer'), getPresentationStats);

// @route   GET /api/presentations/student
// @desc    Get presentations for student (enrolled courses)
// @access  Private (Student)
router.get('/student', protect, restrictTo('student'), getStudentPresentations);

// @route   GET /api/presentations/course/:courseId/students
// @desc    Get enrolled students for a course (for student selection)
// @access  Private (Lecturer)
router.get('/course/:courseId/students', protect, restrictTo('lecturer'), getCourseStudents);

// @route   GET /api/presentations
// @desc    Get all presentations for lecturer
// @access  Private (Lecturer)
router.get('/', protect, restrictTo('lecturer'), getPresentations);

// @route   POST /api/presentations
// @desc    Create new presentation
// @access  Private (Lecturer)
router.post('/', protect, restrictTo('lecturer'), createPresentation);

// @route   PUT /api/presentations/:id
// @desc    Update presentation
// @access  Private (Lecturer)
router.put('/:id', protect, restrictTo('lecturer'), updatePresentation);

// @route   PUT /api/presentations/:id/cancel
// @desc    Cancel presentation
// @access  Private (Lecturer)
router.put('/:id/cancel', protect, restrictTo('lecturer'), cancelPresentation);

// @route   DELETE /api/presentations/:id
// @desc    Delete presentation
// @access  Private (Lecturer)
router.delete('/:id', protect, restrictTo('lecturer'), deletePresentation);

module.exports = router;
