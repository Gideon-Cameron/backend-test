const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson'); // Import the Lesson model

// GET /api/lessons - Retrieve all lessons grouped by sectionId and populate quizId
router.get('/', async (req, res) => {
  try {
    // Fetch all lessons and populate quizId with quiz details
    const lessons = await Lesson.find().populate('quizId'); // Populate quizId with Quiz data

    // Group lessons by sectionId
    const groupedLessons = lessons.reduce((acc, lesson) => {
      const { sectionId, title, difficulty, xpReward, quizId } = lesson;

      if (!acc[sectionId]) {
        acc[sectionId] = {
          sectionId,
          title: `Section ${sectionId}`,
          lessons: [],
        };
      }

      // Prepare lesson data
      const lessonData = {
        _id: lesson._id,
        title,
        difficulty,
        xpReward,
        quizId: quizId ? quizId._id.toString() : null,
      };

      acc[sectionId].lessons.push(lessonData);
      return acc;
    }, {});

    // Convert groupedLessons to an array of sections
    const sections = Object.values(groupedLessons);

    // Log sections for debugging
    console.log('Fetched Sections:', sections);

    res.json(sections);
  } catch (error) {
    console.error('Error fetching lessons:', error.message);
    res.status(500).json({ error: 'Server error. Could not retrieve lessons.' });
  }
});

// GET /api/lessons/:lessonId - Retrieve a single lesson by ID and populate quizId
router.get('/:lessonId', async (req, res) => {
  const { lessonId } = req.params;

  try {
    // Fetch lesson by ID and populate quizId
    const lesson = await Lesson.findById(lessonId).populate('quizId');
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const response = {
      _id: lesson._id,
      title: lesson.title,
      difficulty: lesson.difficulty,
      xpReward: lesson.xpReward,
      quizId: lesson.quizId ? lesson.quizId._id.toString() : null,
    };

    // Log the lesson data for debugging
    console.log('Fetched Lesson:', response);

    res.json(response);
  } catch (error) {
    console.error('Error fetching lesson:', error.message);
    res.status(500).json({ error: 'Server error. Could not retrieve lesson.' });
  }
});

module.exports = router;
