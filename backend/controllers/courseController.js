const asyncHandler = require('express-async-handler');
const Course = require('../models/courseModel');
const User = require('../models/userModel');
const Notification = require('../models/notificationModel');

// @desc    Get all courses for lecturer
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await Course.find({ lecturer: req.user.id })
      .populate('students', 'name email')
      .populate('lecturer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      courses,
      count: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// @desc    Get course stats for lecturer
// @route   GET /api/courses/stats
// @access  Private
const getCourseStats = asyncHandler(async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments({ lecturer: req.user.id });
    const activeCourses = await Course.countDocuments({ 
      lecturer: req.user.id, 
      status: 'active' 
    });
    
    // Get total students across all courses
    const courses = await Course.find({ lecturer: req.user.id });
    const totalStudents = courses.reduce((sum, course) => sum + course.students.length, 0);
    
    // Get total assignments across all courses
    const totalAssignments = courses.reduce((sum, course) => sum + course.assignments.length, 0);

    res.status(200).json({
      success: true,
      stats: {
        total: totalCourses,
        active: activeCourses,
        draft: await Course.countDocuments({ lecturer: req.user.id, status: 'draft' }),
        completed: await Course.countDocuments({ lecturer: req.user.id, status: 'completed' }),
        students: totalStudents,
        assignments: totalAssignments
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course statistics',
      error: error.message
    });
  }
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Private
const createCourse = asyncHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      category,
      level,
      credits,
      duration,
      maxStudents,
      prerequisites,
      syllabus,
      objectives,
      schedule,
      startDate,
      endDate,
      enrollmentStartDate,
      enrollmentEndDate,
      grading,
      tags,
      status
    } = req.body;

    // Debug: Log incoming request body
    console.log('CreateCourse - Request body:', {
      title, description, code, category, credits, startDate, endDate
    });

    // Process and validate input data
    const processedCode = code ? code.toString().toLowerCase().replace(/\s+/g, '') : '';
    const processedCredits = credits !== undefined && credits !== null && credits !== '' ? parseInt(credits.toString()) : null;
    const processedMaxStudents = maxStudents ? parseInt(maxStudents.toString()) : 50;
    
    // Debug: Log processed values
    console.log('CreateCourse - Processed values:', {
      processedCode,
      processedCredits,
      processedMaxStudents
    });
    
    // Process dates - handle YYYY-MM-DD format from HTML date inputs
    let processedStartDate, processedEndDate;
    
    try {
        processedStartDate = startDate ? new Date(startDate.toString()) : null;
        processedEndDate = endDate ? new Date(endDate.toString()) : null;
        
        // Debug: Log date processing
        console.log('CreateCourse - Date processing:', {
          startDate,
          endDate,
          processedStartDate,
          processedEndDate
        });
    } catch (error) {
        console.error('Date parsing error:', error);
        return res.status(400).json({
            success: false,
            message: 'Invalid date format provided'
        });
    }
    
    // Validate required fields - fix validation logic for credits (0 is valid)
    const validationErrors = {};
    
    if (!title || title.trim() === '') validationErrors.title = 'Title is required';
    if (!description || description.trim() === '') validationErrors.description = 'Description is required';
    if (!processedCode || processedCode.trim() === '') validationErrors.code = 'Code is required';
    if (!category || category.trim() === '') validationErrors.category = 'Category is required';
    if (processedCredits === null || processedCredits === undefined || isNaN(processedCredits)) validationErrors.credits = 'Credits is required and must be a valid number';
    if (!processedStartDate || isNaN(processedStartDate.getTime())) validationErrors.startDate = 'Start date is required and must be valid';
    if (!processedEndDate || isNaN(processedEndDate.getTime())) validationErrors.endDate = 'End date is required and must be valid';
    
    // Debug: Log validation results
    console.log('CreateCourse - Validation check:', {
      hasErrors: Object.keys(validationErrors).length > 0,
      errors: validationErrors
    });
    
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        details: validationErrors
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code: processedCode });
    if (existingCourse) {
      console.log('CreateCourse - Course code already exists:', processedCode);
      return res.status(400).json({
        success: false,
        message: 'Course code already exists'
      });
    }

    // Validate date logic
    if (processedEndDate <= processedStartDate) {
      console.log('CreateCourse - Invalid date range:', { processedStartDate, processedEndDate });
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Debug: Log final data before creating course
    const courseData = {
      title: title.trim(),
      description: description.trim(),
      code: processedCode,
      category,
      level: level || 'Beginner',
      credits: processedCredits,
      duration: duration || { weeks: 16, hoursPerWeek: 3 },
      lecturer: req.user.id,
      maxStudents: processedMaxStudents,
      prerequisites: prerequisites || [],
      syllabus: syllabus || '',
      objectives: objectives || [],
      schedule: schedule || [],
      startDate: processedStartDate,
      endDate: processedEndDate,
      enrollmentStartDate: enrollmentStartDate || new Date(),
      enrollmentEndDate: enrollmentEndDate || new Date(processedStartDate),
      grading: grading || {
        assignments: 30,
        presentations: 20,
        midterm: 20,
        final: 30
      },
      tags: tags || [],
      status: status || 'active' // Use provided status or default to active
    };
    
    console.log('CreateCourse - Final course data:', courseData);

    // Create course
    const course = await Course.create(courseData);

    // Populate lecturer information
    await course.populate('lecturer', 'name email');

    console.log('CreateCourse - Course created successfully:', course._id);

    // Create notification for system (optional)
    await Notification.create({
      title: 'New Course Created',
      message: `Course "${title}" has been created successfully`,
      type: 'course_created',
      recipient: req.user.id,
      data: {
        courseId: course._id,
        courseTitle: title,
        courseCode: processedCode
      }
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating course',
      error: error.message
    });
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourse = asyncHandler(async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('students', 'name email profile.avatar')
      .populate('lecturer', 'name email profile.avatar')
      .populate('prerequisites', 'title code');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user has access to this course
    const isLecturer = course.lecturer._id.toString() === req.user.id;
    const isStudent = course.students.some(student => student._id.toString() === req.user.id);

    if (!isLecturer && !isStudent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course',
      error: error.message
    });
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private
const updateCourse = asyncHandler(async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the lecturer of this course
    if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('lecturer', 'name email');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course',
      error: error.message
    });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
const deleteCourse = asyncHandler(async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the lecturer of this course
    if (course.lecturer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course',
      error: error.message
    });
  }
});

// @desc    Get courses for students (all available courses)
// @route   GET /api/courses/available
// @access  Private
const getAvailableCourses = asyncHandler(async (req, res) => {
  try {
    const { category, level, search } = req.query;
    
    // Build query - only require active status, make enrollment dates optional
    let query = { 
      status: 'active'
    };
    
    // Only apply enrollment date filters if they exist
    const now = new Date();
    query.$and = [
      {
        $or: [
          { enrollmentStartDate: { $exists: false } },
          { enrollmentStartDate: { $lte: now } }
        ]
      },
      {
        $or: [
          { enrollmentEndDate: { $exists: false } },
          { enrollmentEndDate: { $gte: now } }
        ]
      }
    ];
    
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('lecturer', 'name email profile.avatar')
      .select('title description code category level credits duration maxStudents students startDate endDate thumbnail tags status')
      .sort({ createdAt: -1 });

    // Add enrollment info to each course
    const coursesWithEnrollmentInfo = courses.map(course => {
      const courseObj = course.toObject();
      courseObj.isEnrolled = course.students.includes(req.user.id);
      courseObj.enrollmentCount = course.students.length;
      courseObj.availableSpots = course.maxStudents ? course.maxStudents - course.students.length : 'unlimited';
      return courseObj;
    });

    res.status(200).json({
      success: true,
      courses: coursesWithEnrollmentInfo,
      count: coursesWithEnrollmentInfo.length
    });
  } catch (error) {
    console.error('Error fetching available courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available courses',
      error: error.message
    });
  }
});

// @desc    Get enrolled courses for student
// @route   GET /api/courses/enrolled
// @access  Private
const getEnrolledCourses = asyncHandler(async (req, res) => {
  try {
    const courses = await Course.find({ 
      students: req.user.id 
    })
    .populate('lecturer', 'name email profile.avatar')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      courses,
      count: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching enrolled courses',
      error: error.message
    });
  }
});

// @desc    Get all active courses for students to browse (simplified)
// @route   GET /api/courses/browse
// @access  Private (Student)
const browseCourses = asyncHandler(async (req, res) => {
  try {
    const { search, category, level } = req.query;
    
    // Simple query - just get all active courses
    let query = { status: 'active' };
    
    // Add optional filters
    if (category) query.category = category;
    if (level) query.level = level;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('lecturer', 'name email')
      .select('title description code category level credits duration maxStudents students startDate endDate thumbnail tags status createdAt')
      .sort({ createdAt: -1 }); // Show newest courses first

    // Add enrollment status and availability info
    const coursesWithStatus = courses.map(course => {
      const courseObj = course.toObject();
      courseObj.isEnrolled = course.students.some(studentId => studentId.toString() === req.user.id);
      courseObj.enrollmentCount = course.students.length;
      courseObj.spotsAvailable = course.maxStudents ? course.maxStudents - course.students.length : 'unlimited';
      courseObj.isFull = course.maxStudents ? course.students.length >= course.maxStudents : false;
      return courseObj;
    });

    console.log(`✅ Found ${courses.length} active courses for student browsing`);

    res.status(200).json({
      success: true,
      courses: coursesWithStatus,
      count: coursesWithStatus.length,
      message: coursesWithStatus.length === 0 ? 'No courses available' : `Found ${coursesWithStatus.length} courses`
    });
  } catch (error) {
    console.error('Error fetching courses for browsing:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

module.exports = {
  getCourses,
  getCourseStats,
  createCourse,
  getCourse,
  updateCourse,
  deleteCourse,
  getAvailableCourses,
  getEnrolledCourses,
  browseCourses
};
