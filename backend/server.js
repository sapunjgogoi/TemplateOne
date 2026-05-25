// backend/server.js - Express server simulating API Gateway & Lambda locally
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { LRUCache } = require('lru-cache');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { handler } = require('../lambda/index');
const { clerkMiddleware, requireAuth } = require('@clerk/express');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connection
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Mount Clerk middleware to inspect and authenticate JWT tokens
app.use(clerkMiddleware());

// Set up rate limiter to prevent abuse (max 100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Too many requests from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// In-memory cache configuration using LRU Cache
const generatorCache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 60, // 1 Hour TTL
});

// Helper to create simple hash key from request parameters
function getCacheKey(body) {
  const {
    projectName = "",
    frontendType = "",
    backendType = "",
    databaseType = "",
    trafficLevel = "",
    freeTierSafe = true,
    devopsFeatures = []
  } = body;
  
  return `${projectName}-${frontendType}-${backendType}-${databaseType}-${trafficLevel}-${freeTierSafe}-${devopsFeatures.join(',')}`;
}

// POST endpoint simulating API Gateway trigger to AWS Lambda
app.post('/api/generate', requireAuth(), async (req, res) => {
  const cacheKey = getCacheKey(req.body);
  console.log(`[AUTH] Request authorized for Clerk User ID: ${req.auth.userId}`);
  
  // Check memory cache
  if (generatorCache.has(cacheKey)) {
    console.log(`[CACHE] Cache hit for key: ${cacheKey}`);
    const cachedResponse = generatorCache.get(cacheKey);
    return res.status(cachedResponse.statusCode).json(JSON.parse(cachedResponse.body));
  }

  console.log(`[SERVER] Invoking lambda handler locally with parameters:`, req.body);
  
  // Prepare AWS Lambda proxy event structure
  const event = {
    body: JSON.stringify(req.body),
    httpMethod: "POST",
    path: "/api/generate",
    headers: req.headers
  };

  try {
    // Invoke Lambda handler
    const lambdaResponse = await handler(event);
    
    // Save successful generated responses to cache
    if (lambdaResponse.statusCode === 200) {
      generatorCache.set(cacheKey, lambdaResponse);
    }
    
    // Parse body and return status
    const parsedBody = JSON.parse(lambdaResponse.body);
    res.status(lambdaResponse.statusCode).json(parsedBody);
  } catch (err) {
    console.error(`[ERROR] Local Lambda invocation failed:`, err);
    res.status(500).json({ error: "Internal Server Error during configuration generation" });
  }
});

// GET health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: "healthy",
    cacheSize: generatorCache.size,
    freeTierLimitEnabled: true
  });
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 AWS Template Creator backend listening on port ${PORT}`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/generate`);
  console.log(`==================================================`);
});
