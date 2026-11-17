import express, { Router } from 'express';
import { chatWithAI, aiHealth } from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';

const router: Router = express.Router();

/**
 * AI Routes for Study Assistant
 * /chat login maangta hai — public rehne par koi bhi Gemini ka free quota khatam kar sakta hai
 */

// Chat endpoint - main functionality
router.post('/chat', protect, chatWithAI);

// Health check endpoint
router.get('/health', aiHealth);

export default router;
