# 🚀 REST API SETUP & DEPLOYMENT GUIDE

Complete guide to setup, run, and deploy the Queue Optimizer REST API.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# Copy all files from outputs/
cd queue-optimizer

# Install npm packages
npm install

# OR if using package-api.json
npm install --save express cors helmet dotenv
npm install --save-dev @types/express @types/cors ts-node nodemon
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env (optional - defaults work fine)
# PORT=3000
# NODE_ENV=development
# CORS_ORIGIN=*
```

### Step 3: Start API Server

```bash
# Development (with auto-reload)
npm run dev
# OR
npm run api

# Production
npm start
# OR
npm run api:prod
```

**Server will start on:** `http://localhost:3000`

**API will be at:** `http://localhost:3000/api/v1`

### Step 4: Test It

```bash
# In another terminal:

# Health check
curl http://localhost:3000/health

# Get API docs
curl http://localhost:3000/api/v1/docs

# Get default config
curl http://localhost:3000/api/v1/config
```

If you see responses, the API is working! ✅

---

## 📁 Directory Structure

```
queue-optimizer/
├── src/
│   ├── api/
│   │   ├── server.ts          ← Main Express server
│   │   ├── routes.ts          ← All endpoints
│   │   ├── controllers.ts     ← Business logic
│   │   ├── middleware.ts      ← Validation, error handling
│   │   └── client.ts          ← API client for React
│   ├── types.ts               ← TypeScript interfaces
│   ├── predictor.ts
│   ├── priorityScorer.ts
│   ├── queueOptimizer.ts
│   ├── metricsCalculator.ts
│   ├── simulator.ts
│   ├── demo.ts
│   └── index.ts               ← Exports
├── dist/                      ← Compiled output
├── package.json
├── tsconfig.json
├── .env.example
├── API.md                     ← API documentation
└── README.md
```

---

## 🔧 Development Setup

### With Auto-Reload (Recommended)

```bash
npm install --save-dev nodemon

# Add to package.json scripts:
"dev": "nodemon --exec ts-node src/api/server.ts"

# Run
npm run dev
```

### With TypeScript Watch

```bash
# Terminal 1: Watch TypeScript compilation
npm run build -- --watch

# Terminal 2: Run server
npm start
```

---

## 📋 API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/optimize` | Reorder queue |
| POST | `/api/v1/simulate` | Full simulation ⭐ |
| POST | `/api/v1/compare` | Baseline vs optimized |
| POST | `/api/v1/metrics` | Calculate metrics |
| GET | `/api/v1/config` | Get default config |
| POST | `/api/v1/config/validate` | Validate config |
| GET | `/api/v1/docs` | API documentation |
| GET | `/health` | Health check |

---

## 🧪 Testing the API

### Method 1: cURL

```bash
# Get default config
curl http://localhost:3000/api/v1/config

# Run simulation
curl -X POST http://localhost:3000/api/v1/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "patients": [
      {"id": "P001", "arrivalTime": "2024-03-13T18:00:00Z", "severity": "high", "waitTime": 25},
      {"id": "P002", "arrivalTime": "2024-03-13T18:05:00Z", "severity": "low", "waitTime": 20}
    ]
  }'
```

### Method 2: Postman

1. Open Postman
2. Create new collection
3. Add requests:

**GET /config**
```
URL: http://localhost:3000/api/v1/config
Method: GET
```

**POST /simulate**
```
URL: http://localhost:3000/api/v1/simulate
Method: POST
Headers: Content-Type: application/json
Body (JSON):
{
  "patients": [
    {"id": "P001", "arrivalTime": "2024-03-13T18:00:00Z", "severity": "high", "waitTime": 25}
  ]
}
```

### Method 3: JavaScript/React

```typescript
const response = await fetch('http://localhost:3000/api/v1/simulate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    patients: [
      { id: 'P001', arrivalTime: new Date(), severity: 'high', waitTime: 25 }
    ]
  })
});

const result = await response.json();
console.log(result);
```

---

## 🌐 Deployment Options

### Option 1: Heroku (Free Alternative)

```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Create app
heroku create queue-optimizer-api

# Add buildpack
heroku buildpacks:add heroku/nodejs

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

Your API will be at: `https://queue-optimizer-api.herokuapp.com`

### Option 2: Render (Recommended - Free)

1. Go to https://render.com
2. Click "New +"
3. Select "Web Service"
4. Connect GitHub repo
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Deploy

Your API will be at: `https://queue-optimizer-xyz.onrender.com`

### Option 3: Railway (Simple)

1. Go to https://railway.app
2. Connect GitHub
3. Railway auto-detects Node.js
4. Deploy automatically

### Option 4: Docker

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Build and run:**
```bash
docker build -t queue-optimizer .
docker run -p 3000:3000 queue-optimizer
```

**Push to Docker Hub:**
```bash
docker tag queue-optimizer yourusername/queue-optimizer
docker push yourusername/queue-optimizer
```

---

## 📝 Environment Variables

**Available:**

```env
PORT=3000                    # Server port
NODE_ENV=development         # development or production
CORS_ORIGIN=*               # CORS allowed origin
LOG_LEVEL=info              # Log verbosity
```

**Example .env file:**

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=error
```

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production`
- [ ] Set `CORS_ORIGIN` to your dashboard URL
- [ ] Test all endpoints
- [ ] Set up error logging
- [ ] Configure rate limiting (optional)
- [ ] Set up HTTPS
- [ ] Test with production data
- [ ] Set up monitoring/alerts
- [ ] Document API usage
- [ ] Create API key system (optional)

---

## 🔒 Securing the API

### Add Authentication (Optional)

```typescript
// Add to middleware
const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use('/api/v1', apiKeyAuth, routes);
```

### Add Rate Limiting (Optional)

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

---

## 🐛 Troubleshooting

### Error: Port 3000 already in use

```bash
# Change port
PORT=3001 npm run dev

# Or kill process on port
lsof -ti:3000 | xargs kill -9
```

### Error: Cannot find module

```bash
# Rebuild TypeScript
npm run build

# Clear node_modules
rm -rf node_modules
npm install
```

### CORS errors in browser

Check `.env` file:
```env
CORS_ORIGIN=http://localhost:3000  # Your dashboard URL
```

### API returns empty response

Check if:
1. Server is running (`npm run dev`)
2. URL is correct (http://localhost:3000/api/v1)
3. Request body is valid JSON
4. Patients array has valid data

### High latency or timeouts

- Reduce number of patients
- Increase server timeout
- Check network connection
- Monitor server resources

---

## 📊 Monitoring & Logs

### Console Logs

The server prints request logs:
```
[2024-03-13T18:00:00.000Z] POST /api/v1/simulate - 200 (145ms)
```

### File Logging (Optional)

```typescript
import fs from 'fs';

const logStream = fs.createWriteStream('api.log', { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
```

### Performance Monitoring

```bash
npm install clinic

clinic doctor -- npm start
```

---

## 🚀 Deployment Checklist

- [ ] Code tested locally
- [ ] Environment variables configured
- [ ] npm install works
- [ ] Build succeeds (`npm run build`)
- [ ] Server starts (`npm start`)
- [ ] All endpoints work
- [ ] CORS configured
- [ ] Error handling works
- [ ] Ready to deploy!

---

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| API not responding | Check if server is running, check port |
| CORS error | Update CORS_ORIGIN in .env |
| Validation error | Check JSON format of request body |
| Slow response | Reduce patient count, check server resources |

### Resources

- API Documentation: [API.md](./API.md)
- Endpoints: [src/api/routes.ts](./src/api/routes.ts)
- Controllers: [src/api/controllers.ts](./src/api/controllers.ts)
- Express Docs: https://expressjs.com
- Node.js Docs: https://nodejs.org

---

**Ready to deploy!** 🚀
