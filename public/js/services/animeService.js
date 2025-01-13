import { RateLimiter } from '../utils/RateLimiter.js';

export class AnimeService {
    constructor() {
        this.rateLimiter = new RateLimiter(1, 2000);
        this.baseUrl = '/api';
        this.progressCallback = null;
    }

    setProgressCallback(callback) {
        this.progressCallback = callback;
    }

    async fetchAnimeDetails(animeId) {
        const headers = {};
        const token = localStorage.getItem('malToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else if (window.MAL_CLIENT_ID) {
            headers['X-MAL-CLIENT-ID'] = window.MAL_CLIENT_ID;
        }
        return this.rateLimiter.add(async () => {
            if (this.progressCallback) {
                this.progressCallback();
            }
            const response = await fetch(`${this.baseUrl}/anime/details/${animeId}`, { headers });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        });
    }

    async fetchAnimeList(username, isAuthenticated) {
        const url = isAuthenticated ? 
            `${this.baseUrl}/user/animelist` : 
            `${this.baseUrl}/anime/${username}`;
        const headers = {};
        if (isAuthenticated) {
            const token = localStorage.getItem('malToken');
            if (!token) throw new Error('No authentication token found');
            headers['Authorization'] = `Bearer ${token}`;
        }
        const response = await fetch(`${url}?fields=alternative_titles,main_picture`, { headers });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async fetchMALClientId() {
        const response = await fetch(`${this.baseUrl}/config`);
        if (!response.ok) throw new Error('Failed to fetch MAL client ID');
        const config = await response.json();
        window.MAL_CLIENT_ID = config.clientId;
    }
}