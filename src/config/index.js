require('dotenv').config();

const config = {
    mal: {
        clientId: process.env.MAL_CLIENT_ID,
        clientSecret: process.env.MAL_CLIENT_SECRET,
        redirectUri: process.env.NODE_ENV === 'production'
            ? `${process.env.BASE_URL}/auth/mal/callback`
            : 'http://localhost:3000/auth/mal/callback'
    },
    env: process.env.NODE_ENV || 'development'
};

module.exports = config;