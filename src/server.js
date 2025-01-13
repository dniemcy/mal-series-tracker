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

app.use(express.json());
app.use(cors());
app.use(sessionMiddleware);
app.use(express.static('public'));

app.use('/api/user', animeRoutes.authenticatedRoutes);
app.use('/api/anime', animeRoutes.publicRoutes);
app.use('/auth', authRoutes);
app.use('/api', configRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});