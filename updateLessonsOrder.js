const mongoose = require('mongoose');
const Lesson = require('../models/Lesson');

const updateLessonOrder = async () => {
  try {
    const sections = await Lesson.distinct('sectionId');  // Get all section IDs

    for (const section of sections) {
      const lessons = await Lesson.find({ sectionId: section }).sort({ title: 1 });  // Sort by title or another property
      
      for (let i = 0; i < lessons.length; i++) {
        lessons[i].order = i + 1;  // Start from 1 for each section
        await lessons[i].save();
        console.log(`Updated ${lessons[i].title} - Section ${section}, Order: ${i + 1}`);
      }
    }
    console.log('Lesson orders updated successfully.');
  } catch (error) {
    console.error('Error updating lesson orders:', error);
  } finally {
    mongoose.connection.close();  // Close DB connection after completion
  }
};

// Connect to DB and run the update
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    updateLessonOrder();
  })
  .catch((err) => console.error('Failed to connect to MongoDB:', err));
