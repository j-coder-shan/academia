const express = require('express');
const router = express.Router();
const {
  getStudentDashboard,
  getStudentCourses,
  getCourseDetails,
  submitAssignment,
  getStudentGrades,
  getAvailableCourses,
  enrollInCourse
} = require('../controllers/studentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);
router.use(restrictTo('student'));

// @route   GET /api/student/dashboard
// @desc    Get student dashboard data
// @access  Private (Student only)
router.get('/dashboard', getStudentDashboard);

// @route   GET /api/student/courses
// @desc    Get student courses
// @access  Private (Student only)
router.get('/courses', getStudentCourses);

// @route   GET /api/student/courses/:id
// @desc    Get course details
// @access  Private (Student only)
router.get('/courses/:id', getCourseDetails);

// @route   POST /api/student/assignments/:assignmentId/submit
// @desc    Submit assignment
// @access  Private (Student only)
router.post('/assignments/:assignmentId/submit', submitAssignment);

// @route   GET /api/student/grades
// @desc    Get student grades
// @access  Private (Student only)
router.get('/grades', getStudentGrades);

// @route   GET /api/student/available-courses
// @desc    Get available courses for enrollment
// @access  Private (Student only)
router.get('/available-courses', getAvailableCourses);

// @route   POST /api/student/enroll/:courseId
// @desc    Enroll in a course
// @access  Private (Student only)
router.post('/enroll/:courseId', enrollInCourse);

module.exports = router;
