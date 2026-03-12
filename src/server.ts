import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from './lib/redis';

// Import main root router
import rootRouter from './routes/router';

const app = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use((req, res, next) => {
  console.log(`[Express] Early Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

// --- Middleware: อ่าน JSON ---
app.use(express.json());

// --- Middleware: Session + Redis Store ---
const isProd = process.env.NODE_ENV === 'production';
const cookieDomain    = process.env.COOKIE_DOMAIN || undefined;          // prod: '.example.com'
const cookieSecure    = process.env.COOKIE_SECURE === 'true' || isProd; // dev: false, prod: true
const cookieSameSite  = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';
const sessionMaxAge   = parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10) * 24 * 60 * 60 * 1000;

app.use(
  session({
    store: new (RedisStore as any)({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'dev_fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,           // ป้องกัน JS ฝั่ง client อ่าน cookie
      secure: cookieSecure,     // HTTPS only ใน prod
      sameSite: cookieSameSite,
      domain: cookieDomain,     // subdomain sharing ใน prod (undefined = ไม่กำหนดใน dev)
      maxAge: sessionMaxAge,
    },
  })
);

// --- Router ---
app.use('/api', rootRouter);

// Server setup
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}/`);
  console.log(`Login:  POST http://localhost:${port}/api/auth/login`);
  console.log(`Me:     GET  http://localhost:${port}/api/auth/me`);
  console.log(`Logout: POST http://localhost:${port}/api/auth/logout`);
});
