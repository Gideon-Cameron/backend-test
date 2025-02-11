const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const mongoose = require('mongoose');

// Helper function to calculate level based on total XP
const calculateLevel = (xp) => {
  let level = 1;
  let xpForNextLevel = 100;

  while (xp >= xpForNextLevel) {
    xp -= xpForNextLevel;
    level++;
    xpForNextLevel += 50;
  }

  return {
    level,
    xpRemaining: xp,
    xpForNextLevel,
  };
};

// POST /api/quiz-completion/:quizId/complete


//
// POST /api/quiz-completion/:quizId/complete
router.post('/:quizId/complete', async (req, res) => {
  const { userId, lessonId, score, totalQuestions } = req.body;

  try {
    console.log(`[QuizCompletion] Processing completion for user: ${userId}, lesson: ${lessonId}`);

    // Validate input
    if (!userId || !lessonId || typeof score !== 'number' || typeof totalQuestions !== 'number') {
      return res.status(400).json({ error: 'Invalid input data. Please provide all fields.' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ error: 'Invalid user or lesson ID format.' });
    }

    // Fetch user and lesson
    const user = await User.findById(userId);
    const currentLesson = await Lesson.findById(lessonId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentLesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const sectionId = currentLesson.sectionId;

    // Check for existing lesson progress
    let lessonProgress = user.progress.find(
      (p) => p.lessonId.toString() === lessonId.toString()
    );

    // Calculate score percentage
    const scorePercentage = (score / totalQuestions) * 100;

    // Only mark the lesson as completed if the score is 70% or more
    const isCompleted = scorePercentage >= 70;

    // Update the user's progress only if they passed the 70% threshold
    if (lessonProgress) {
      lessonProgress.completed = isCompleted;
      lessonProgress.score = Math.max(lessonProgress.score, score);
    } else {
      user.progress.push({
        sectionId,
        lessonId: lessonId.toString(),
        completed: isCompleted,
        score,
      });
    }

    // Unlock the next lesson in the same section by order
    const nextLesson = await Lesson.findOne({
      sectionId: sectionId,
      order: currentLesson.order + 1,
    });

    if (nextLesson) {
      const isAlreadyUnlocked = user.progress.some(
        (p) => p.lessonId.toString() === nextLesson._id.toString()
      );

      if (!isAlreadyUnlocked) {
        user.progress.push({
          sectionId: nextLesson.sectionId,
          lessonId: nextLesson._id.toString(),
          completed: false,
          score: 0,
        });
        console.log(`[QuizCompletion] Unlocked next lesson: ${nextLesson.title}`);
      }
    }

    // XP Calculation
    const baseXp = isCompleted ? 20 : 0; // XP given only if lesson is completed
    const scoreBonus = Math.floor((score / totalQuestions) * 10);
    const xpGained = baseXp + scoreBonus;

    user.totalXp += xpGained;
    const { level, xpRemaining, xpForNextLevel } = calculateLevel(user.totalXp);
    user.level = level;
    user.xp = xpRemaining;

    // Save user progress
    await user.save();

    res.json({
      message: 'Quiz completed successfully!',
      xpGained,
      totalXP: user.totalXp,
      xpRemaining,
      xpForNextLevel,
      level: user.level,
    });
  } catch (error) {
    console.error('Error completing quiz:', error);
    res.status(500).json({ error: 'Server error. Could not update XP.' });
  }
});

// GET /api/quiz-completion/:quizId
router.get('/:quizId', async (req, res) => {
  const { quizId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ error: 'Invalid quiz ID format.' });
    }

    const quiz = await Quiz.findById(quizId).populate('lessonId');
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    console.log('Quiz before processing:', quiz.questions);

    quiz.questions = generateTenQuestions(quiz.questions);

    console.log('Quiz after processing:', quiz.questions);

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error.message);
    res.status(500).json({ error: 'Server error. Could not retrieve quiz.' });
  }
});

// Helper to generate a random set of 10 questions
function generateTenQuestions(questions) {
  const wordLearningQuestions = questions.filter((q) => q.questionType === 'wordLearning');
  const otherQuestions = questions.filter((q) => q.questionType !== 'wordLearning');

  console.log('Word Learning Questions:', wordLearningQuestions);
  console.log('Other Questions (before shuffle):', otherQuestions);

  // Shuffle only the non-wordLearning questions
  const shuffledOtherQuestions = otherQuestions.sort(() => Math.random() - 0.5);

  console.log('Shuffled Other Questions:', shuffledOtherQuestions);

  // Combine wordLearning questions (in order) + shuffled others
  const result = [...wordLearningQuestions, ...shuffledOtherQuestions].slice(0, 10);

  console.log('Final Questions for Quiz:', result);

  return result;
}

// Helper to shuffle array
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

module.exports = router;
