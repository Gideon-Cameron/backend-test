const mongoose = require('mongoose');
const Lesson = require('./models/Lesson');  // Adjust the path if needed

mongoose.connect('mongodb://localhost:27017/fluentwave', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const addOrderToLessons = async () => {
  try {
    const sections = await Lesson.aggregate([
      {
        $group: {
          _id: "$sectionId",
          lessons: { $push: "$_id" },
        },
      },
    ]);

    for (const section of sections) {
      const sortedLessons = await Lesson.find({ sectionId: section._id }).sort({ _id: 1 });

      for (let i = 0; i < sortedLessons.length; i++) {
        const lesson = sortedLessons[i];
        const orderValue = i + 1;  // Start order at 1

        await Lesson.updateOne(
          { _id: lesson._id },
          { $set: { order: NumberInt(orderValue) } }
        );

        // Log the updated lesson and order
        console.log(
          `Updated lesson "${lesson.title}" (ID: ${lesson._id}) with order: ${orderValue}`
        );
      }
    }

    console.log('Order fields added successfully to all lessons.');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error updating lessons:', error);
    mongoose.connection.close();
  }
};

addOrderToLessons();
