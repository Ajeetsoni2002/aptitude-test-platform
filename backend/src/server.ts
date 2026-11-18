// backend/src/server.ts
// ─────────────────────────────────────────────────────────────
// Server Entry Point
// Yahan sirf server start hota hai + DB connect hoti hai
// Graceful shutdown bhi handle hota hai (production best practice)
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';
import app, { allowedOrigins } from './app';
import connectDB from './config/db';
import { initializeProctoringSocket } from './socket/proctoringSocket';
import { startKeepAlive } from './utils/keepAlive';

// Environment variables se port lo, default 5000
const PORT = process.env.PORT || 5000;

// ─── Environment Variable Validation ───────────────────────────
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  console.log('─── Environment Variable Check ───────────────────');

  // Critical (server won't work without these)
  const critical = ['MONGO_URI', 'JWT_SECRET'];
  for (const key of critical) {
    if (!process.env[key]?.trim()) {
      console.error(`❌ CRITICAL: ${key} is missing!`);
    } else {
      console.log(`  ✅ ${key} — configured`);
    }
  }

  // Important services
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  console.log(geminiKey
    ? `  ✅ GEMINI_API_KEY — configured (model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'})`
    : '  ⚠️  GEMINI_API_KEY — NOT SET (AI features will be disabled)'
  );

  const cloudinaryConfigured =
    process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
    process.env.CLOUDINARY_API_KEY?.trim() &&
    process.env.CLOUDINARY_API_SECRET?.trim();
  console.log(cloudinaryConfigured
    ? `  ✅ CLOUDINARY — configured (cloud: ${process.env.CLOUDINARY_CLOUD_NAME})`
    : `  ${isProduction ? '⚠️ ' : 'ℹ️ '} CLOUDINARY — NOT SET (images will be stored locally)`,
  );

  const brevoConfigured = process.env.BREVO_API_KEY?.trim();
  const smtpConfigured = process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim();
  console.log(brevoConfigured
    ? '  ✅ EMAIL — Brevo API configured'
    : smtpConfigured
      ? '  ✅ EMAIL — SMTP configured (Render free tier par SMTP blocked hai — BREVO_API_KEY use karo)'
      : '  ⚠️  EMAIL — NOT SET (email features will be disabled)'
  );

  console.log('──────────────────────────────────────────────────');
};

// ─── Start Server ──────────────────────────────────────────────
const startServer = async (): Promise<void> => {
  try {
    // Step 0: Validate environment variables
    validateEnv();

    // Step 1: MongoDB Atlas se connect karo
    await connectDB();

    // Step 2: HTTP server + Socket.IO (live proctoring ke liye)
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true },
      pingInterval: 25000,
      pingTimeout: 60000,
    });
    initializeProctoringSocket(io);
    app.locals.io = io;

    // Step 3: Server start karo
    const server = httpServer.listen(PORT, () => {
      console.log('─────────────────────────────────────────');
      console.log(`🚀 Server running on PORT: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
      console.log('📡 Socket.IO enabled for live proctoring');
      console.log('─────────────────────────────────────────');
    });

    // Step 4: Render free tier ko sone se rokne ke liye self-ping (har 5 min)
    const keepAliveTimer = startKeepAlive();

    // ─── Graceful Shutdown ───────────────────────────────────
    // Docker/Kubernetes SIGTERM signal pe server ko properly band karo
    // Forceful kill se data corruption ho sakti hai — isliye graceful shutdown zaroori hai
    const gracefulShutdown = (signal: string) => {
      console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
      if (keepAliveTimer) clearInterval(keepAliveTimer);
      io.close();
      server.close(() => {
        console.log('✅ HTTP & Socket.IO server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Non-zero exit = error (CI/CD pipelines ko pata chale)
  }
};

startServer();
