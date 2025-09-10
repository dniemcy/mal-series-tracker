import crypto from 'crypto';

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier: string): string {
  return verifier;
}

export {
  generateCodeVerifier,
  generateCodeChallenge
};
