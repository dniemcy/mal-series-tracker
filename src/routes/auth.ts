import express, { Request, Response } from 'express';
import axios from 'axios';
import config from '../config';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/auth';

const router = express.Router();

router.get('/mal', (req: Request, res: Response) => {
  const codeVerifier = generateCodeVerifier();
  req.session.codeVerifier = codeVerifier;
  req.session.save(() => {
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const authUrl = new URL('https://myanimelist.net/v1/oauth2/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', config.mal.clientId || '');
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'plain');
    authUrl.searchParams.append('redirect_uri', config.mal.redirectUri);
    res.redirect(authUrl.toString());
  });
});

interface MalTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface MalUserResponse {
  id: number;
  name: string;
  picture?: string;
}

router.get('/mal/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      return res.redirect('/');
    }
    const codeVerifier = req.session.codeVerifier;
    if (!codeVerifier) {
      return res.redirect('/?error=no_verifier');
    }
    
    const response = await axios.post<MalTokenResponse>(
      'https://myanimelist.net/v1/oauth2/token',
      new URLSearchParams({
        client_id: config.mal.clientId || '',
        client_secret: config.mal.clientSecret || '',
        code,
        code_verifier: codeVerifier,
        grant_type: 'authorization_code',
        redirect_uri: config.mal.redirectUri
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const accessToken = response.data.access_token;
    const userResponse = await axios.get<MalUserResponse>('https://api.myanimelist.net/v2/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const userInfo = userResponse.data;
    res.redirect(`/?token=${accessToken}&user=${userInfo.name}&picture=${encodeURIComponent(userInfo.picture || '')}`);
  } catch (error) {
    console.error('Auth error:', axios.isAxiosError(error) ? error.response?.data : error);
    res.redirect('/?error=auth_failed');
  }
});

export default router;
