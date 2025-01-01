const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const dbURI = 'mongodb+srv://gideonwork20:6pUvhcdOahu2R6V8@fluentwave.8zqhq.mongodb.net/Fluentwave?retryWrites=true&w=majority';

mongoose.connect(dbURI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Define the Quiz model explicitly for the quizzes collection
    const Quiz = mongoose.model('Quiz', new mongoose.Schema({
      _id: String,
      lessonId: String,
      questions: Array
    }), 'quizzes'); // Specify the collection name explicitly

    try {
      const quizzes = await Quiz.find();

      // Process each quiz document
      for (const quiz of quizzes) {
        if (typeof quiz._id === 'string') {
          const newObjectId = new ObjectId(quiz._id); // Create new ObjectId

          // Insert a new document with the ObjectId `_id` and identical data
          await Quiz.collection.insertOne({
            _id: newObjectId,
            lessonId: quiz.lessonId,
            questions: quiz.questions,
          });

          // Remove the old document with string `_id`
          await Quiz.deleteOne({ _id: quiz._id });
          console.log(`Converted Quiz ID ${quiz._id} to ObjectId`);
        }
      }

      console.log('Conversion complete.');
    } catch (error) {
      console.error('Error during conversion:', error);
    } finally {
      mongoose.connection.close();
    }
  })
  .catch((err) => console.error('MongoDB connection error:', err));
