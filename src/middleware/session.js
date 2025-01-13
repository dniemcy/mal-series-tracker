const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const crypto = require('crypto');

const ONE_DAY = 86400000;

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
    resave: true,
    saveUninitialized: true,
    store: new MemoryStore({
        checkPeriod: ONE_DAY
    }),
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: ONE_DAY,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
});

module.exports = sessionMiddleware;