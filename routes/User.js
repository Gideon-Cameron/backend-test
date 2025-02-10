const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const BlacklistedToken = require('../models/BlacklistedToken');
const { authenticateUser } = require('../middleware/auth');
const mongoose = require('mongoose');

const router = express.Router();

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only .jpeg, .png, and .jpg formats are allowed.'));
  },
});

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Calculate user level dynamically
const calculateLevel = (totalXp) => {
  let level = 1;
  let xpForNextLevel = 100;
  let remainingXP = totalXp;

  while (remainingXP >= xpForNextLevel) {
    remainingXP -= xpForNextLevel;
    level++;
    xpForNextLevel += 50;
  }

  return { level, xp: remainingXP, xpNeededForNextLevel: xpForNextLevel };
};

// GET /api/users/profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const totalXp = user.totalXp || 0;
    const levelInfo = calculateLevel(totalXp);

    const completedLessons = user.progress
      .filter((lesson) => lesson.completed)
      .map((l) => l.lessonId);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        totalXp,
        level: levelInfo.level,
        xp: levelInfo.xp,
        xpNeededForNextLevel: levelInfo.xpNeededForNextLevel,
        streak: user.streak,
        completedLessons,
        progress: user.progress,
        achievements: user.achievements || [],
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    res.status(500).json({ success: false, error: 'Server error. Could not fetch user profile.' });
  }
});

// GET /api/users/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({}, 'name avatar xp totalXp level')
      .sort({ totalXp: -1 })
      .limit(50);
    const leaderboard = topUsers.map((user, index) => {
      const levelInfo = calculateLevel(user.totalXp || 0);
      return {
        rank: index + 1,
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        xp: levelInfo.xp,
        level: levelInfo.level,
      };
    });

    res.status(200).json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error.message);
    res.status(500).json({ success: false, error: 'Server error. Could not fetch leaderboard.' });
  }
});

// POST /api/users/add-xp
router.post('/add-xp', authenticateUser, async (req, res) => {
  const { xpEarned, lessonId } = req.body;

  if (!xpEarned || xpEarned <= 0) {
    return res.status(400).json({ success: false, error: 'XP must be greater than zero.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.addXP(xpEarned);

    if (lessonId) {
      await user.completeLesson(lessonId);
    }

    await user.save();

    const levelInfo = calculateLevel(user.totalXp);

    res.status(200).json({
      success: true,
      message: 'XP added successfully. Lesson marked as completed.',
      data: {
        level: levelInfo.level,
        xp: levelInfo.xp,
        xpNeededForNextLevel: levelInfo.xpNeededForNextLevel,
        totalXp: user.totalXp,
        progress: user.progress,
      },
    });
  } catch (error) {
    console.error('Error adding XP:', error.message);
    res.status(500).json({ success: false, error: 'Server error. Could not add XP.' });
  }
});

// POST /api/users/register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    const newUser = new User({ name, email, password });
    const savedUser = await newUser.save();
    const token = generateToken(savedUser._id);

    res.status(201).json({
      success: true,
      token,
      data: { id: savedUser._id, name: savedUser.name, email: savedUser.email },
    });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).json({ success: false, error: 'Server error. Could not register user.' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({ success: true, token, data: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ success: false, error: 'Server error. Could not log in.' });
  }
});

module.exports = router;
