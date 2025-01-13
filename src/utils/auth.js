const crypto = require('crypto');

function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
    return verifier; 
}

module.exports = {
    generateCodeVerifier,
    generateCodeChallenge
};