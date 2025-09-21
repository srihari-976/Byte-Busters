// AI Server - Standalone server for AI predictions
const express = require('express');
const cors = require('cors');
const aiService = require('./ai-service');

const app = express();
const PORT = process.env.AI_PORT || 3002;

app.use(cors());
app.use(express.json());

// Mount AI service routes
app.use('/api', aiService);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'ai-predictions', version: '1.0' });
});

app.listen(PORT, () => {
  console.log(`AI Prediction Service running on port ${PORT}`);
});