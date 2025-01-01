const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz'); // Import the Quiz model

// GET /api/quizzes/:quizId - Fetch a quiz by its ID
router.get('/:quizId', async (req, res) => {
  const { quizId } = req.params;

  try {
    const quiz = await Quiz.findById(quizId); // Find quiz by ID
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz); // Send the quiz as a JSON response
  } catch (error) {
    console.error('Error fetching quiz:', error.message);
    res.status(500).json({ error: 'Server error. Could not retrieve quiz.' });
  }
});

// POST /api/quizzes - Create a new quiz
router.post('/', async (req, res) => {
  const { lessonId, questions } = req.body;

  // Validate required fields
  if (!lessonId || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Please provide lessonId and a non-empty questions array.' });
  }

  try {
    const newQuiz = new Quiz({
      lessonId,
      questions
    });

    const savedQuiz = await newQuiz.save(); // Save the quiz to the database
    res.status(201).json(savedQuiz); // Return the saved quiz with a 201 Created status
  } catch (error) {
    console.error('Error creating quiz:', error.message);
    res.status(500).json({ error: 'Server error. Could not create quiz.' });
  }
});

// PUT /api/quizzes/:quizId - Update an existing quiz
router.put('/:quizId', async (req, res) => {
  const { quizId } = req.params;
  const { lessonId, questions } = req.body;

  try {
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      quizId,
      { lessonId, questions },
      { new: true, runValidators: true } // Return the updated document
    );

    if (!updatedQuiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error.message);
    res.status(500).json({ error: 'Server error. Could not update quiz.' });
  }
});

// DELETE /api/quizzes/:quizId - Delete a quiz
router.delete('/:quizId', async (req, res) => {
  const { quizId } = req.params;

  try {
    const deletedQuiz = await Quiz.findByIdAndDelete(quizId);

    if (!deletedQuiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json({ message: 'Quiz successfully deleted' });
  } catch (error) {
    console.error('Error deleting quiz:', error.message);
    res.status(500).json({ error: 'Server error. Could not delete quiz.' });
  }
});

module.exports = router;
