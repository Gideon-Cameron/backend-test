const mongoose = require('mongoose');

// Replace with your MongoDB connection string
const dbURI = 'mongodb+srv://gideonwork20:6pUvhcdOahu2R6V8@fluentwave.8zqhq.mongodb.net/Fluentwave?retryWrites=true&w=majority';

mongoose.connect(dbURI)
  .then(async () => {node server.js
    
    console.log('Connected to MongoDB');

    // Convert quizId to ObjectId in the lessons collection
    const result = await mongoose.connection.db.collection('lessons').updateOne(
      { _id: new mongoose.Types.ObjectId("6718adfd87026cae60a695a1") },
      { $set: { quizId: new mongoose.Types.ObjectId("6724497c04cadd41d0c47d1f") } }
    );

    console.log('Update result:', result);
    mongoose.connection.close();
  })
  .catch(err => console.error('Connection error:', err));
