const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseStats,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  getAvailableCourses,
  getEnrolledCourses,
  browseCourses
} = require('../controllers/courseController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public routes (with authentication)
router.get('/browse', protect, browseCourses); // Simple course browsing for students
router.get('/available', protect, getAvailableCourses);
router.get('/enrolled', protect, getEnrolledCourses);

// Lecturer routes
router.get('/stats', protect, restrictTo('lecturer', 'admin'), getCourseStats);
router.get('/', protect, restrictTo('lecturer', 'admin'), getCourses);
router.post('/', protect, restrictTo('lecturer', 'admin'), createCourse);

// Course-specific routes
router.get('/:id', protect, getCourse);
router.put('/:id', protect, restrictTo('lecturer', 'admin'), updateCourse);
router.delete('/:id', protect, restrictTo('lecturer', 'admin'), deleteCourse);

module.exports = router;
