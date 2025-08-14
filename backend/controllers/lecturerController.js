const Course = require('../models/courseModel');
const User = require('../models/userModel');
const Presentation = require('../models/presentationModel');

// @desc    Get lecturer dashboard data
// @route   GET /api/lecturer/dashboard
// @access  Private
const getLecturerDashboard = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    
    // Get courses taught by lecturer with populated data
    const courses = await Course.find({ lecturer: lecturerId })
      .populate('students', 'name email studentId')
      .populate('assignments.submissions.student', 'name email');

    // Get presentations created by lecturer with populated data
    const presentations = await Presentation.find({ lecturer: lecturerId })
      .populate('course', 'name code')
      .populate('selectedStudents', 'name email');

    // Calculate statistics from real database data
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, course) => acc + (course.students ? course.students.length : 0), 0);
    const totalPresentations = presentations.length;
    
    // Calculate evaluations from actual assignments data
    let pendingEvaluations = 0;
    let completedEvaluations = 0;
    
    courses.forEach(course => {
      if (course.assignments && course.assignments.length > 0) {
        course.assignments.forEach(assignment => {
          if (assignment.submissions && assignment.submissions.length > 0) {
            assignment.submissions.forEach(submission => {
              if (submission.status === 'submitted') {
                pendingEvaluations++;
              } else if (submission.status === 'graded') {
                completedEvaluations++;
              }
            });
          }
        });
      }
    });

    // Get recent activities from real data
    const recentSubmissions = getRecentSubmissions(courses);

    res.json({
      statistics: {
        totalCourses,
        totalStudents,
        totalPresentations,
        pendingEvaluations,
        completedEvaluations
      },
      courses: courses.slice(0, 5), // Recent 5 courses
      presentations: presentations.slice(0, 5), // Recent 5 presentations
      recentSubmissions
    });
  } catch (error) {
    console.error('Error in lecturer dashboard:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get lecturer courses
// @route   GET /api/lecturer/courses
// @access  Private
const getLecturerCourses = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const { status, search } = req.query;
    
    let query = { lecturer: lecturerId };
    
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
      .populate('students', 'name email')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new course
// @route   POST /api/lecturer/courses
// @access  Private
const createCourse = async (req, res) => {
  try {
    const { title, description, category, duration, maxStudents } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      duration,
      maxStudents,
      lecturer: req.user.id,
      status: 'active',
      createdAt: new Date()
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/lecturer/courses/:id
// @access  Private
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if lecturer owns the course
    if (course.lecturer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('students', 'name email');

    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/lecturer/courses/:id
// @access  Private
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if lecturer owns the course
    if (course.lecturer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await course.deleteOne();

    res.json({ message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create assignment
// @route   POST /api/lecturer/courses/:courseId/assignments
// @access  Private
const createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, totalPoints } = req.body;
    const courseId = req.params.courseId;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if lecturer owns the course
    if (course.lecturer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    course.assignments.push({
      title,
      description,
      dueDate,
      totalPoints,
      createdAt: new Date()
    });

    await course.save();

    res.status(201).json({ message: 'Assignment created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Grade assignment
// @route   PUT /api/lecturer/assignments/:assignmentId/submissions/:submissionId/grade
// @access  Private
const gradeAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;

    const course = await Course.findOne({
      'assignments._id': assignmentId,
      lecturer: req.user.id
    });

    if (!course) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const assignment = course.assignments.id(assignmentId);
    const submission = assignment.submissions.id(submissionId);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date();

    await course.save();

    res.json({ message: 'Assignment graded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending evaluations
// @route   GET /api/lecturer/evaluations
// @access  Private
const getPendingEvaluations = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    
    const courses = await Course.find({ lecturer: lecturerId })
      .populate('assignments.submissions.student', 'name email');

    const pendingEvaluations = [];

    courses.forEach(course => {
      course.assignments.forEach(assignment => {
        assignment.submissions.forEach(submission => {
          if (submission.status === 'submitted') {
            pendingEvaluations.push({
              submissionId: submission._id,
              assignmentId: assignment._id,
              assignmentTitle: assignment.title,
              courseTitle: course.title,
              studentName: submission.student.name,
              studentEmail: submission.student.email,
              submittedAt: submission.submittedAt,
              content: submission.content,
              attachments: submission.attachments
            });
          }
        });
      });
    });

    res.json(pendingEvaluations.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get recent submissions from real database data
const getRecentSubmissions = (courses) => {
  const submissions = [];
  
  courses.forEach(course => {
    if (course.assignments && course.assignments.length > 0) {
      course.assignments.forEach(assignment => {
        if (assignment.submissions && assignment.submissions.length > 0) {
          assignment.submissions.forEach(submission => {
            submissions.push({
              id: submission._id,
              assignmentTitle: assignment.title,
              courseTitle: course.title,
              studentName: submission.student?.name || 'Unknown Student',
              submittedAt: submission.submittedAt,
              status: submission.status,
              grade: submission.grade || null
            });
          });
        }
      });
    }
  });

  // Sort by submission date (newest first) and return top 5
  return submissions
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 5);
};

module.exports = {
  getLecturerDashboard,
  getLecturerCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  createAssignment,
  gradeAssignment,
  getPendingEvaluations,
};
