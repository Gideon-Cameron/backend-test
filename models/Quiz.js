const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Quiz schema
const QuizSchema = new Schema({
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
  questions: [
    {
      questionType: { type: String, required: true }, // e.g., 'multipleChoice', 'matching'
      questionText: { type: String, required: true }, // The actual question text
      options: {
        type: Schema.Types.Mixed, // Allows for array of strings or objects (for matching)
        required: false,
        default: []
      },
      correctAnswer: { 
        type: Schema.Types.Mixed, 
        required: true 
      } // Flexible type: string, array, or object
    }
  ]
});

module.exports = mongoose.model('Quiz', QuizSchema);
 