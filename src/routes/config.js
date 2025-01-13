const express = require('express');
const router = express.Router();
const config = require('../config');

router.get('/config', (req, res) => {
    try {
        if (!config.mal.clientId) {
            throw new Error('MAL configuration missing');
        }
        res.json({
            clientId: config.mal.clientId
        });
    } catch (error) {
        console.error('Config route error:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

module.exports = router;