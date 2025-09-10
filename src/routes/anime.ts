import express, { Request, Response } from 'express';
import axios from 'axios';
import config from '../config';

const authenticatedRouter = express.Router();
const publicRouter = express.Router();

interface AnimeApiErrorResponse {
  error: string;
  message?: string;
}

authenticatedRouter.get('/animelist', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Valid authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const response = await axios.get(
        'https://api.myanimelist.net/v2/users/@me/animelist',
        {
          params: {
            fields: 'list_status,num_episodes,media_type,status,score,title,synopsis,mean',
            limit: 1000,
            nsfw: true
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return res.json(response.data);
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        return res.status(apiError.response.status).json({
          error: 'MAL API Error',
          details: apiError.response.data
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Error in /user/animelist:', error);
    res.status(500).json({
      error: 'Failed to fetch authenticated user anime list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

publicRouter.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    try {
      const response = await axios.get(
        `https://api.myanimelist.net/v2/users/${username}/animelist`,
        {
          params: {
            fields: 'list_status,num_episodes,media_type,status,score,title,synopsis,mean',
            limit: 1000,
            nsfw: true
          },
          headers: {
            'X-MAL-CLIENT-ID': config.mal.clientId
          }
        }
      );
      return res.json(response.data);
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        return res.status(apiError.response.status).json({
          error: 'MAL API Error',
          details: apiError.response.data
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Error in /:username:', error);
    res.status(500).json({
      error: 'Failed to fetch user anime list',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

publicRouter.get('/details/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = {};
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      headers['Authorization'] = authHeader;
    } else {
      headers['X-MAL-CLIENT-ID'] = config.mal.clientId || '';
    }
    
    try {
      const response = await axios.get(
        `https://api.myanimelist.net/v2/anime/${id}`,
        {
          params: {
            fields: 'id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics'
          },
          headers: headers
        }
      );
      return res.json(response.data);
    } catch (apiError) {
      if (axios.isAxiosError(apiError) && apiError.response) {
        return res.status(apiError.response.status).json({
          error: 'MAL API Error',
          details: apiError.response.data
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Error in /details/:id:', error);
    res.status(500).json({
      error: 'Failed to fetch anime details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const authenticatedRoutes = authenticatedRouter;
export const publicRoutes = publicRouter;
