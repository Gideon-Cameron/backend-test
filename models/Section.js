const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Section schema
const SectionSchema = new Schema({
  title: { type: String, required: true },
  lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }]
});

module.exports = mongoose.model('Section', SectionSchema);
