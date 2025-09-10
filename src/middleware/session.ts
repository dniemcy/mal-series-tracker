import session from 'express-session';
import createMemoryStore from 'memorystore';
import crypto from 'crypto';

const MemoryStore = createMemoryStore(session);

const ONE_DAY = 86400000;

// Custom interface to extend express-session
declare module 'express-session' {
  interface SessionData {
    codeVerifier?: string;
  }
}

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: ONE_DAY
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: ONE_DAY,
  }
});

export default sessionMiddleware;
