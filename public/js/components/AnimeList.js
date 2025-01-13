
import { AnimeSeries } from '../models/AnimeSeries.js';
import { AnimeService } from '../services/animeService.js';

export class AnimeList {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.animeService = new AnimeService();
        this.fullAnimeData = new Map();
        this.totalRequests = 0;
        this.countedProgressIds = new Set();
        this.userStatusMap = new Map();
        this.animeService.setProgressCallback(() => this.updateProgressCounter());
    }

    async initialize(username, isAuthenticated) {
        try {
            this.showLoading();
            const data = await this.animeService.fetchAnimeList(username, isAuthenticated);
            data.data.forEach(anime => {
                this.userStatusMap.set(anime.node.id, anime.list_status);
            });
            await this.displayAnimeList(data.data, username);
        } catch (error) {
            this.handleError(error);
        }
    }

    showLoading() {
        this.container.style.display = 'none';
        document.getElementById('loadingProgress').style.display = 'block';
        document.body.style.overflow = 'auto';
    }

    updateProgressCounter() {
        this.totalRequests++;
        const progressContainer = document.getElementById('loadingProgress');
        const counter = progressContainer.querySelector('.request-counter');
        if (!counter) return;
        counter.innerHTML = `Total Animes Fetched: ${this.totalRequests}`;
    }

    async fetchAnimeWithRelated(animeId, visitedIds = new Set(), seriesMap, userAnimeIds) {
        if (visitedIds.has(animeId)) return null;
        visitedIds.add(animeId);
        const existingSeries = seriesMap.get(animeId);
        if (existingSeries) {
            return this.fullAnimeData.get(animeId);
        }

        try {
            const anime = await this.animeService.fetchAnimeDetails(animeId);
            const userStatus = this.userStatusMap.get(animeId);
            if (userStatus) {
                anime.list_status = userStatus;
            }
            if (userAnimeIds.has(animeId) && !this.countedProgressIds.has(animeId)) {
                this.countedProgressIds.add(animeId);
            }
            this.fullAnimeData.set(animeId, anime);
            if (!anime.related_anime) return anime;
            const sequel = anime.related_anime.find(
                (related) =>
                    related.relation_type === 'sequel' ||
                    related.relation_type === 'sequel_season'
            );
            if (sequel && !visitedIds.has(sequel.node.id)) {
                const sequelDetails = await this.fetchAnimeWithRelated(
                    sequel.node.id,
                    visitedIds,
                    seriesMap,
                    userAnimeIds
                );
                if (sequelDetails) {
                    anime.sequel = sequelDetails;
                }
            }
            return anime;
        } catch (error) {
            console.error(`Error fetching anime ${animeId}:`, error);
            if ([504, 502, 503].includes(error.status)) {
                console.warn(`Retrying fetch for anime ${animeId}`);
                return await this.fetchAnimeWithRelated(animeId, visitedIds, seriesMap, userAnimeIds);
            }
            return null;
        }
    }

    async displayAnimeList(animeList, username) {
        if (!animeList || animeList.length === 0) {
            this.container.innerHTML = '<p>No anime found in list.</p>';
            return;
        }

        this.container.innerHTML = `
            <div class="user-profile-header">
                <h2>${username}'s Anime List</h2>
            </div>
        `;

        this.countedProgressIds = new Set();
        const seriesMap = new Map();
        const watchStatusMap = new Map();

        animeList.forEach(anime => {
            watchStatusMap.set(anime.node.id, anime.list_status.status);
        });

        const userAnimeIds = new Set(animeList.map(anime => anime.node.id));

        const fetchPromises = animeList.map(anime =>
            this.fetchAnimeWithRelated(anime.node.id, new Set(), seriesMap, userAnimeIds)
                .then(details => {
                    if (!details) return;
                    details.list_status = anime.list_status;
                    this.fullAnimeData.set(anime.node.id, details);
                    let series = null;
                    let currentAnime = details;
                    while (currentAnime) {
                        if (seriesMap.has(currentAnime.id)) {
                            series = seriesMap.get(currentAnime.id);
                            break;
                        }
                        currentAnime = currentAnime.sequel;
                    }
                    if (!series) {
                        series = new AnimeSeries(details);
                        seriesMap.set(details.id, series);
                    }
                    currentAnime = details;
                    while (currentAnime) {
                        if (!series.hasProcessedId(currentAnime.id)) {
                            series.addAnime(currentAnime);
                            seriesMap.set(currentAnime.id, series);
                        }
                        currentAnime = currentAnime.sequel;
                    }
                })
        );
        await Promise.all(fetchPromises);
        const uniqueSeries = [...new Set(seriesMap.values())].sort((a, b) =>
            (a.title || '').localeCompare(b.title || '')
        );
        this.container.innerHTML += this.renderSeriesList(uniqueSeries, watchStatusMap);
        const seriesCount = uniqueSeries.length;
        document.querySelector('.user-profile-header').innerHTML = `
            <h2>${username}'s Anime List</h2>
            <span class="series-count">Series Count: ${seriesCount}</span>
        `;
        document.getElementById('loadingProgress').style.display = 'none';
        this.container.style.display = 'block';
    }

    renderSeriesList(uniqueSeries, watchStatusMap) {
        return uniqueSeries.map(series => `
            <div class="series-container">
                <h2 class="series-title">${series.title}</h2>
                <div class="anime-grid">
                    ${series.animeList.map(anime => this.renderAnimeCard(anime, watchStatusMap)).join('')}
                </div>
            </div>
        `).join('');
    }

    renderAnimeCard(anime, watchStatusMap) {
        const userStatus = this.userStatusMap.get(anime.id) || {};
        const watchStatus = watchStatusMap.get(anime.id);
        const isWatched = watchStatus === 'completed' || watchStatus === 'watching';
        return `
            <div class="anime-card ${!isWatched ? 'unwatched' : ''}" 
                 onclick="getAnimeDetails(${anime.id})" 
                 id="anime-${anime.id}">
                <div class="anime-image-container">
                    ${anime.main_picture ? 
                        `<img src="${anime.main_picture.medium}" 
                              alt="${anime.title}" 
                              class="anime-cover">` :
                        `<div class="anime-cover-placeholder">No Image</div>`
                    }
                    <div class="anime-overlay">
                        <div class="anime-stats">
                            <p>Score: ${userStatus.score || 'N/A'}</p>
                            <p>Status: ${watchStatus || 'Not in list'}</p>
                            <p>Episodes: ${anime.num_episodes}</p>
                            ${anime.mean ? `<p>Mean Score: ${anime.mean}</p>` : ''}
                        </div>
                    </div>
                </div>
                <h3 class="anime-title">${anime.alternative_titles?.en || anime.title}</h3>
            </div>
        `;
    }

    handleError(error) {
        document.body.style.overflow = 'hidden';
        let errorMessage;
        if (error.message.includes('MAL API Error')) {
            errorMessage = 'User not found';
        } else {
            errorMessage = `Error fetching anime list: ${error.message}`;
        }
        this.container.innerHTML = `
            <div class="error-container">
                <div class="error-content">
                    <i class="fas fa-exclamation-circle error-icon"></i>
                    <p class="error-message">
                        ${errorMessage}
                    </p>
                    <button onclick="window.location.href='/'" class="search-button">
                        <i class="fas fa-arrow-left"></i> Back to Search
                    </button>
                </div>
            </div>
        `;
        document.getElementById('loadingProgress').style.display = 'none';
        this.container.style.display = 'block';
    }

    getAnimeData(animeId) {
        return this.fullAnimeData.get(animeId);
    }
}