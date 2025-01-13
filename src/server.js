const express = require('express');
const cors = require('cors');
const path = require('path');
const sessionMiddleware = require('./middleware/session');
const animeRoutes = require('./routes/anime');
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.BASE_URL 
        : 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(express.static('public'));
app.use(sessionMiddleware);

app.use('/api/user', animeRoutes.authenticatedRoutes);
app.use('/api/anime', animeRoutes.publicRoutes);
app.use('/auth', authRoutes);
app.use('/api', configRoutes);

if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});