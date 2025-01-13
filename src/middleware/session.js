const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const crypto = require('crypto');

const ONE_DAY = 86400000;

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

module.exports = sessionMiddleware;