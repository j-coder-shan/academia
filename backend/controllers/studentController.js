const Course = require('../models/courseModel');
const User = require('../models/userModel');
const Presentation = require('../models/presentationModel');

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get enrolled courses
    const enrolledCourses = await Course.find({
      'students': studentId
    }).populate('lecturer', 'name email');

    // Get presentations for enrolled courses or where student is specifically selected
    const courseIds = enrolledCourses.map(course => course._id);
    const presentations = await Presentation.find({
      $or: [
        { course: { $in: courseIds }, status: { $in: ['published', 'active'] } },
        { selectedStudents: studentId, status: { $in: ['published', 'active'] } }
      ]
    }).populate('course', 'name code');

    // Calculate statistics
    const totalCourses = enrolledCourses.length;
    const totalPresentations = presentations.length; // Add presentations count
    
    const completedAssignments = enrolledCourses.reduce((acc, course) => {
      return acc + course.assignments.filter(assignment => 
        assignment.submissions.some(sub => sub.student.toString() === studentId && sub.status === 'graded')
      ).length;
    }, 0);

    const pendingAssignments = enrolledCourses.reduce((acc, course) => {
      return acc + course.assignments.filter(assignment => 
        !assignment.submissions.some(sub => sub.student.toString() === studentId)
      ).length;
    }, 0);

    // Calculate average grade
    let totalGrade = 0;
    let gradedAssignments = 0;
    
    enrolledCourses.forEach(course => {
      course.assignments.forEach(assignment => {
        const submission = assignment.submissions.find(sub => 
          sub.student.toString() === studentId && sub.status === 'graded'
        );
        if (submission) {
          totalGrade += submission.grade;
          gradedAssignments++;
        }
      });
    });

    const averageGrade = gradedAssignments > 0 ? (totalGrade / gradedAssignments).toFixed(1) : 0;

    res.json({
      statistics: {
        totalCourses,
        totalPresentations, // Include presentations count
        completedAssignments,
        pendingAssignments,
        averageGrade
      },
      enrolledCourses: enrolledCourses.slice(0, 5), // Recent 5 courses
      presentations: presentations.slice(0, 5), // Recent 5 presentations
      upcomingAssignments: getUpcomingAssignments(enrolledCourses, studentId)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student courses
// @route   GET /api/student/courses
// @access  Private
const getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status, search } = req.query;
    
    let query = { 'students': studentId };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('lecturer', 'name email')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course details
// @route   GET /api/student/courses/:id
// @access  Private
const getCourseDetails = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('lecturer', 'name email')
      .populate('assignments.submissions.student', 'name');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if student is enrolled
    if (!course.students.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit assignment
// @route   POST /api/student/assignments/:assignmentId/submit
// @access  Private
const submitAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { content, attachments } = req.body;
    const studentId = req.user.id;

    const course = await Course.findOne({
      'assignments._id': assignmentId,
      'students': studentId
    });

    if (!course) {
      return res.status(404).json({ message: 'Assignment or course not found' });
    }

    const assignment = course.assignments.id(assignmentId);
    
    // Check if already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === studentId
    );

    if (existingSubmission) {
      return res.status(400).json({ message: 'Assignment already submitted' });
    }

    // Add submission
    assignment.submissions.push({
      student: studentId,
      content,
      attachments,
      submittedAt: new Date(),
      status: 'submitted'
    });

    await course.save();

    res.json({ message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student grades
// @route   GET /api/student/grades
// @access  Private
const getStudentGrades = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const courses = await Course.find({
      'students': studentId
    }).populate('lecturer', 'name');

    const grades = [];

    courses.forEach(course => {
      course.assignments.forEach(assignment => {
        const submission = assignment.submissions.find(
          sub => sub.student.toString() === studentId && sub.status === 'graded'
        );
        
        if (submission) {
          grades.push({
            course: course.title,
            lecturer: course.lecturer.name,
            assignment: assignment.title,
            grade: submission.grade,
            feedback: submission.feedback,
            gradedAt: submission.gradedAt
          });
        }
      });
    });

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all available courses for enrollment
// @route   GET /api/student/available-courses
// @access  Private
const getAvailableCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all active courses that the student is not enrolled in
    const availableCourses = await Course.find({
      status: 'active',
      students: { $ne: studentId },
      $expr: { $lt: [{ $size: '$students' }, '$maxStudents'] }
    }).populate('lecturer', 'name email academicInfo.department')
      .select('title description code category credits duration startDate endDate schedule maxStudents students tags level');

    // Add enrollment count to each course
    const coursesWithStats = availableCourses.map(course => ({
      ...course.toObject(),
      enrolledCount: course.students.length,
      availableSpots: course.maxStudents - course.students.length
    }));

    res.json(coursesWithStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Enroll student in a course
// @route   POST /api/student/enroll/:courseId
// @access  Private
const enrollInCourse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const courseId = req.params.courseId;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if course is active
    if (course.status !== 'active') {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
    }

    // Check if student is already enrolled
    if (course.students.includes(studentId)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check if course is full
    if (course.students.length >= course.maxStudents) {
      return res.status(400).json({ message: 'Course is full' });
    }

    // Add student to course
    course.students.push(studentId);
    await course.save();

    // Populate course data for response
    await course.populate('lecturer', 'name email');

    res.json({
      message: 'Successfully enrolled in course',
      course: {
        id: course._id,
        title: course.title,
        code: course.code,
        lecturer: course.lecturer.name,
        enrolledCount: course.students.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get upcoming assignments
const getUpcomingAssignments = (courses, studentId) => {
  const upcoming = [];
  
  courses.forEach(course => {
    course.assignments.forEach(assignment => {
      const hasSubmitted = assignment.submissions.some(
        sub => sub.student.toString() === studentId
      );
      
      if (!hasSubmitted && new Date(assignment.dueDate) > new Date()) {
        upcoming.push({
          id: assignment._id,
          title: assignment.title,
          course: course.title,
          dueDate: assignment.dueDate,
          courseId: course._id
        });
      }
    });
  });

  return upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).slice(0, 5);
};

module.exports = {
  getStudentDashboard,
  getStudentCourses,
  getCourseDetails,
  submitAssignment,
  getStudentGrades,
  getAvailableCourses,
  enrollInCourse
};
