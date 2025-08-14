const express = require('express');
const router = express.Router();
const {
  getLecturerDashboard,
  getLecturerCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  createAssignment,
  gradeAssignment,
  getPendingEvaluations,
} = require('../controllers/lecturerController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);
router.use(restrictTo('lecturer'));

// @route   GET /api/lecturer/dashboard
// @desc    Get lecturer dashboard data
// @access  Private (Lecturer only)
router.get('/dashboard', getLecturerDashboard);

// @route   GET /api/lecturer/courses
// @desc    Get lecturer courses
// @access  Private (Lecturer only)
router.get('/courses', getLecturerCourses);

// @route   POST /api/lecturer/courses
// @desc    Create new course
// @access  Private (Lecturer only)
router.post('/courses', createCourse);

// @route   PUT /api/lecturer/courses/:id
// @desc    Update course
// @access  Private (Lecturer only)
router.put('/courses/:id', updateCourse);

// @route   DELETE /api/lecturer/courses/:id
// @desc    Delete course
// @access  Private (Lecturer only)
router.delete('/courses/:id', deleteCourse);

// @route   POST /api/lecturer/courses/:courseId/assignments
// @desc    Create assignment
// @access  Private (Lecturer only)
router.post('/courses/:courseId/assignments', createAssignment);

// @route   PUT /api/lecturer/assignments/:assignmentId/submissions/:submissionId/grade
// @desc    Grade assignment
// @access  Private (Lecturer only)
router.put('/assignments/:assignmentId/submissions/:submissionId/grade', gradeAssignment);

// @route   GET /api/lecturer/evaluations
// @desc    Get pending evaluations
// @access  Private (Lecturer only)
router.get('/evaluations', getPendingEvaluations);

module.exports = router;
