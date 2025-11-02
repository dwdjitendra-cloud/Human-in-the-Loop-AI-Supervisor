import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { errorMiddleware } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';
import { startTimeoutHandler } from './services/timeoutHandler.js';
import { aiAgent } from './services/aiAgent.js';

import helpRequestsRouter from './routes/helpRequests.js';
import knowledgeBaseRouter from './routes/knowledgeBase.js';
import supervisorsRouter from './routes/supervisors.js';
import webhookRouter from './routes/webhook.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/help-requests', helpRequestsRouter);
app.use('/api/knowledge-base', knowledgeBaseRouter);
app.use('/api/supervisors', supervisorsRouter);
app.use('/api/webhook', webhookRouter);

app.post('/api/simulate-call', express.json(), async (req, res) => {
  const { customerName, question } = req.body;

  if (!customerName || !question) {
    return res.status(400).json({
      success: false,
      message: 'Customer name and question are required',
    });
  }

  const result = await aiAgent.processCall(customerName, question);

  res.json({
    success: true,
    data: result,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use(errorMiddleware);

startTimeoutHandler();

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
