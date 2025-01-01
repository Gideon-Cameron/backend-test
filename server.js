require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created at', uploadsDir);
}

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000' })); // Adjust origin based on frontend deployment
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir)); // Serve uploaded files statically

// MongoDB connection URI from .env
const dbURI = process.env.MONGO_URI;

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

// Authentication Middleware
const { authenticateUser } = require('./middleware/auth'); 
const BlacklistedToken = require('./models/BlacklistedToken'); // Import BlacklistedToken model

// Routes
const lessonRoutes = require('./routes/lessons');
const quizCompletionRoutes = require('./routes/quizCompletion');
const userRoutes = require('./routes/User');
const fileUploadRoutes = require('./routes/FileUpload');

// Use Routes
app.use('/api/lessons', lessonRoutes);
app.use('/api/quiz-completion', quizCompletionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/uploads', fileUploadRoutes);

// Test Endpoint
app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'Test endpoint is working!' });
});

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is healthy' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'FluentWave Backend is Running!',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Protected route example
app.get('/api/protected', authenticateUser, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Logout Route (Token Blacklist)
app.post('/api/users/logout', authenticateUser, async (req, res) => {
  try {
    const token = req.header('Authorization').split(' ')[1]; // Extract token
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Add token to blacklist
    await BlacklistedToken.create({ token });

    res.status(200).json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ error: 'Internal server error during logout' });
  }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
