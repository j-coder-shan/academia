const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, employeeId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Validate role-specific ID
    if (role === 'student' && !studentId) {
      return res.status(400).json({ message: 'Student ID is required for student registration' });
    }
    if (role === 'lecturer' && !employeeId) {
      return res.status(400).json({ message: 'Employee ID is required for lecturer registration' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if ID already exists
    if (role === 'student') {
      const idExists = await User.findOne({ 'academicInfo.studentId': studentId });
      if (idExists) {
        return res.status(400).json({ message: 'Student ID already exists' });
      }
    }
    if (role === 'lecturer') {
      const idExists = await User.findOne({ 'academicInfo.employeeId': employeeId });
      if (idExists) {
        return res.status(400).json({ message: 'Employee ID already exists' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      academicInfo: {}
    };

    // Set appropriate ID based on role
    if (role === 'student') {
      userData.academicInfo.studentId = studentId;
      console.log('Setting studentId:', studentId);
    } else if (role === 'lecturer') {
      userData.academicInfo.employeeId = employeeId;
      console.log('Setting employeeId:', employeeId);
    }

    console.log('User data before create:', userData);

    // Create user
    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, studentId, employeeId, userType } = req.body;

    let user;

    console.log('Login attempt with:', { email, studentId, employeeId, userType });

    // Handle different login methods
    if (email) {
      // Traditional email login (for backward compatibility)
      user = await User.findOne({ email });
      console.log('Email login - User found:', !!user);
    } else if (studentId) {
      // Student ID login
      user = await User.findOne({ 'academicInfo.studentId': studentId });
      console.log('StudentId login - User found:', !!user);
    } else if (employeeId) {
      // Employee ID login
      user = await User.findOne({ 'academicInfo.employeeId': employeeId });
      console.log('EmployeeId login - User found:', !!user);
    } else {
      return res.status(400).json({ message: 'Please provide login credentials' });
    }

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.academicInfo?.studentId,
        employeeId: user.academicInfo?.employeeId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // Return user data with all necessary fields
    const userData = {
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profile: req.user.profile,
        academicInfo: req.user.academicInfo,
        preferences: req.user.preferences,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin
      }
    };
    
    console.log(`📋 Returning user data for: ${req.user.name} (Role: ${req.user.role})`);
    res.status(200).json(userData);
  } catch (error) {
    console.error('❌ Error in getMe:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};
