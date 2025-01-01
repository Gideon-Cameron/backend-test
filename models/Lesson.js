const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LessonSchema = new Schema({
  sectionId: {
    type: String,
    required: true,
    index: true,  // Ensure faster lookups by section
  },
  title: {
    type: String,
    required: true,
    trim: true,  // Prevent extra whitespace in titles
  },
  description: {
    type: String,
    default: '',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Easy',
  },
  xpReward: {
    type: Number,
    default: 50,
    min: 0,  // Ensure XP can't be negative
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
  },
  order: {
    type: Number,
    required: true,
    min: 1,  // Order should always be positive
  },
  unlockCondition: {
    type: String,
    enum: ['Immediate', 'PreviousComplete', 'Custom'],
    default: 'PreviousComplete',  // Control how lessons are unlocked
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to improve performance for lesson ordering and unlocking
LessonSchema.index({ sectionId: 1, order: 1 }, { unique: true });

// Middleware to prevent duplicate lessons with the same order in the same section
LessonSchema.pre('save', async function (next) {
  const existingLesson = await mongoose.model('Lesson').findOne({
    sectionId: this.sectionId,
    order: this.order,
    _id: { $ne: this._id },  // Exclude self during update
  });

  if (existingLesson) {
    const error = new Error('A lesson with this order already exists in this section.');
    next(error);
  } else {
    next();
  }
});

module.exports = mongoose.model('Lesson', LessonSchema);
