import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './lib/redis';

// Import main root router
import rootRouter from './routes/router';

const app = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.set('trust proxy', 1);

// --- Middleware: CORS ---
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001', 
  'http://localhost:6060',
  'http://127.0.0.1:3000', 
  'http://127.0.0.1:3001',
  'http://127.0.0.1:6060'
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || isProd) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.error(`[DEBUG] Incoming ${req.method} ${req.url}`);
  console.error(`[DEBUG] Body: ${JSON.stringify(req.body)}`);
  next();
});

// --- Middleware: Session + Redis Store ---
const isProd = process.env.NODE_ENV === 'production';
const cookieDomain    = process.env.COOKIE_DOMAIN || undefined;          // prod: '.example.com'
const cookieSecure    = process.env.COOKIE_SECURE === 'true' || isProd; // dev: false, prod: true
const cookieSameSite  = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';
const sessionMaxAge   = parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10) * 24 * 60 * 60 * 1000;

const redisStore = new (RedisStore as any)({
  client: redisClient,
  prefix: "sess:",
});

app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || 'dev_fallback_secret',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
      httpOnly: true,
      secure: false, 
      sameSite: 'lax',
      maxAge: sessionMaxAge,
    },
  })
);

app.use((req, res, next) => {
  console.log(`[Express] Session ID: ${req.sessionID}`);
  next();
});

// --- Router ---
app.use('/api', rootRouter);

// Server setup
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀🚀🚀 UNIQUE SERVER START AT ${new Date().toISOString()}`);
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`Login:  POST http://localhost:${port}/api/auth/login`);
  console.log(`Me:     GET  http://localhost:${port}/api/auth/me`);
  console.log(`Logout: POST http://localhost:${port}/api/auth/logout`);
});
