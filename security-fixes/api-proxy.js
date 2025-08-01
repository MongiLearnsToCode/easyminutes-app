// Backend API Proxy (Node.js/Express)
// This should run on your server, not in the browser

const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '10mb' }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Initialize Gemini client server-side with environment variable
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY // Server environment variable
});

// Input validation middleware
const validateInput = (req, res, next) => {
  const { input } = req.body;
  
  if (!input) {
    return res.status(400).json({ error: 'Input is required' });
  }
  
  // Validate input size (prevent large payloads)
  if (typeof input === 'string' && input.length > 50000) {
    return res.status(400).json({ error: 'Input too large' });
  }
  
  next();
};

// Secure API endpoint
app.post('/api/summarize', validateInput, async (req, res) => {
  try {
    const { input } = req.body;
    
    // Add your existing summarization logic here
    // but now it runs server-side with hidden API key
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: input,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

app.listen(3001, () => {
  console.log('API proxy server running on port 3001');
});
