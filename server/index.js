const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/authRoutes');
const queueRoutes = require('./routes/queueRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const seedData = require('./utils/seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auto-seed default manager and demo data if empty
seedData(false).catch(err => {
  console.error('Failed to run initial seed:', err);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/analytics', analyticsRoutes);

// Quick seed reset endpoint for demonstration / evaluation
app.post('/api/admin/reset-demo', async (req, res) => {
  try {
    await seedData(true);
    res.json({ success: true, message: 'Database reset to demo state successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Reset failed: ' + err.message });
  }
});

// Health check endpoint for Render deployment monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// For SPA routing: serve index.html for any unmatched route
app.use((req, res, next) => {
  // If request is for an API route that wasn't matched, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }

  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>QueueFlow API Server</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>QueueFlow API Server is Running!</h1>
            <p>Port: ${PORT}</p>
            <p>Health: <a href="/health">/health</a></p>
            <p>API Queues: <a href="/api/queues">/api/queues</a></p>
            <p>Frontend will be available once built (<code>npm run build</code>).</p>
          </body>
        </html>
      `);
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 QueueFlow Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
