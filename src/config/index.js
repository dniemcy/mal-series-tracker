require('dotenv').config();

const config = {
    mal: {
        clientId: process.env.MAL_CLIENT_ID,
        clientSecret: process.env.MAL_CLIENT_SECRET,
        redirectUri: `${process.env.BASE_URL}/auth/mal/callback`
    }
};

module.exports = config;