const express = require('express');
const axios = require('axios');
const config = require('../config');
const { generateCodeVerifier, generateCodeChallenge } = require('../utils/auth');

const router = express.Router();

router.get('/mal', (req, res) => {
    const codeVerifier = generateCodeVerifier();
    req.session.codeVerifier = codeVerifier;
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).send('Error initializing authentication');
        }
        const codeChallenge = generateCodeChallenge(codeVerifier);
        const authUrl = new URL('https://myanimelist.net/v1/oauth2/authorize');
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('client_id', config.mal.clientId);
        authUrl.searchParams.append('code_challenge', codeChallenge);
        authUrl.searchParams.append('code_challenge_method', 'plain');
        authUrl.searchParams.append('redirect_uri', config.mal.redirectUri);
        res.redirect(authUrl.toString());
    });
});

router.get('/mal/callback', async (req, res) => {
    if (req.query.error === 'access_denied') {
        return res.redirect('/');
    }
    try {
        const { code } = req.query;
        if (!code) {
            return res.redirect('/');
        }
        const codeVerifier = req.session.codeVerifier;
        if (!codeVerifier) {
            console.error('No code verifier found in session');
            return res.status(400).send('Authentication failed - No code verifier');
        }
        const response = await axios.post('https://myanimelist.net/v1/oauth2/token', 
            new URLSearchParams({
                client_id: config.mal.clientId,
                client_secret: config.mal.clientSecret,
                code,
                code_verifier: codeVerifier,
                grant_type: 'authorization_code',
                redirect_uri: config.mal.redirectUri
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        const accessToken = response.data.access_token;
        req.session.accessToken = accessToken;
        const userResponse = await axios.get('https://api.myanimelist.net/v2/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const userInfo = userResponse.data;
        res.redirect(`/?token=${accessToken}&user=${userInfo.name}&picture=${encodeURIComponent(userInfo.picture)}`);
    } catch (error) {
        console.error('Auth error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Authentication failed',
            details: error.response?.data || error.message 
        });
    }
});

module.exports = router;