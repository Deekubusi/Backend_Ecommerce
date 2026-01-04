const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database/sqlite');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const startServer = async () => {
  try {
    await initDatabase();
    console.log('Database is successfully initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }

  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/uploads', express.static('uploads'));

 
  app.get('/', (req, res) => {
    res.send('Backend Ecommerce API is running 🚀');
  });


  app.get('/api/health', (req, res) => {
    res.json({
      message: 'Server is running!',
      database: 'SQLite',
      timestamp: new Date().toISOString()
    });
  });

 
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong'
    });
  });


  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
