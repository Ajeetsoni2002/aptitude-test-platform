// backend/src/app.ts
// ─────────────────────────────────────────────────────────────
// Express Application Configuration
// app.ts = middleware + routes setup (server start NAHI hota yahan)
// Reason: Testing ke liye app ko server se alag rakhte hain
// ─────────────────────────────────────────────────────────────
import errorHandler from './middlewares/errorHandler';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import questionRoutes from './routes/questionRoutes';
import testRoutes from './routes/testRoutes';
import adminRoutes from './routes/adminRoutes';
import scheduledTestRoutes from './routes/scheduledTestRoutes';
import notificationRoutes from './routes/notificationRoutes';
import aiRoutes from './routes/aiRoutes';
import proctoringRoutes from './routes/proctoringRoutes';
const app: Application = express();

// Render/AWS jaise platforms load balancer ke peeche chalte hain.
// Iske bina req.ip = proxy ka IP hoga aur rate-limiter sab users ko ek hi IP maanega.
app.set('trust proxy', 1);

// ─── Security Middleware ───────────────────────────────────────
// helmet: Sets secure HTTP response headers (XSS, clickjacking protection)
// crossOriginResourcePolicy: frontend alag domain par hai, isliye /uploads images
// cross-origin load honi chahiye (default 'same-origin' unhe block kar deta)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// cors: Allow requests from React frontend
// Trailing slash hata do — "https://x.onrender.com/" aur Origin header match nahi karte
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// ─── Rate Limiting ─────────────────────────────────────────────
// Prevent brute-force attacks: default 500 requests per 15 minutes per IP
// (college lab me kai students ek hi public IP share karte hain — RATE_LIMIT_MAX se adjust karo)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use('/api', limiter); // Only apply to /api routes

// ─── Request Parsing Middleware ────────────────────────────────
app.use(express.json({ limit: '10mb' }));           // Parse JSON body
app.use(express.urlencoded({ extended: true }));    // Parse URL-encoded body
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── HTTP Request Logger ───────────────────────────────────────
// morgan 'dev' mode: coloured logs in terminal → [GET] /api/auth/login 200 12ms
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check Route ────────────────────────────────────────
// Simple route to verify server is running (used by DevOps/monitoring tools)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '✅ Aptitude Test Platform API is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);                    // ✅ Auth
app.use('/api/users', userRoutes);                   // ✅ User Profile & Stats
app.use('/api/questions', questionRoutes);          // ✅ Questions
app.use('/api/tests', testRoutes);                  // ✅ Tests
app.use('/api/admin', adminRoutes);                 // ✅ Admin stats
app.use('/api/scheduled-tests', scheduledTestRoutes); // ✅ Scheduled Tests
app.use('/api/notifications', notificationRoutes);  // ✅ Notifications
app.use('/api/ai', aiRoutes);                       // ✅ AI Assistant (Gemini)
app.use('/api/proctoring', proctoringRoutes);       // ✅ Proctoring System


// ─── 404 Handler ──────────────────────────────────────────────
// Yeh tab chalega jab koi route match na ho
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '🚫 Route not found. Please check the API endpoint.',
  });
});

// ─── Global Error Handler ──────────────────────────────────────
// Express ka built-in error handler override karte hain
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use(errorHandler);

export default app;
