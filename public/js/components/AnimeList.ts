import { AnimeSeries } from '../models/AnimeSeries.js';
import { AnimeService } from '../services/animeService.js';
import { Anime, AnimeListResponse } from '../types/index.js';

interface AnimeListStatus {
  status: string;
  score: number;
  num_episodes_watched: number;
  is_rewatching: boolean;
  updated_at: string;
}

interface AnimeNode {
  node: Anime;
  list_status?: AnimeListStatus;
}

declare global {
  interface Window {
    getAnimeDetails: (id: number) => void;
  }
}

export class AnimeList {
  private container: HTMLElement | null;
  private animeService: AnimeService;
  private fullAnimeData: Map<number, Anime>;
  private totalRequests: number;
  private countedProgressIds: Set<number>;
  private userStatusMap: Map<number, AnimeListStatus>;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    this.animeService = new AnimeService();
    this.fullAnimeData = new Map();
    this.totalRequests = 0;
    this.countedProgressIds = new Set();
    this.userStatusMap = new Map();
    this.animeService.setProgressCallback(() => this.updateProgressCounter());
  }

  async initialize(username: string, isAuthenticated: boolean): Promise<void> {
    try {
      this.showLoading();
      const data = await this.animeService.fetchAnimeList(username, isAuthenticated);
      data.data.forEach(anime => {
        if (anime.list_status && anime.node.id) {
          this.userStatusMap.set(anime.node.id, anime.list_status);
        }
      });
      await this.displayAnimeList(data.data, username);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private showLoading(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
    const loadingElement = document.getElementById('loadingProgress');
    if (loadingElement) {
      loadingElement.style.display = 'block';
    }
    document.body.style.overflow = 'auto';
  }

  private updateProgressCounter(): void {
    this.totalRequests++;
    const progressContainer = document.getElementById('loadingProgress');
    if (!progressContainer) return;
    
    const counter = progressContainer.querySelector('.request-counter');
    if (!counter) return;
    
    counter.innerHTML = `Total Animes Fetched: ${this.totalRequests}`;
  }

  private async fetchAnimeWithRelated(
    animeId: number, 
    visitedIds: Set<number> = new Set(), 
    seriesMap: Map<number, AnimeSeries>,
    userAnimeIds: Set<number>
  ): Promise<Anime | null> {
    if (visitedIds.has(animeId)) return null;
    visitedIds.add(animeId);
    
    const existingSeries = seriesMap.get(animeId);
    if (existingSeries) {
      return this.fullAnimeData.get(animeId) || null;
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
          (anime as any).sequel = sequelDetails;
        }
      }
      
      return anime;
    } catch (error: any) {
      console.error(`Error fetching anime ${animeId}:`, error);
      if ([504, 502, 503].includes(error.status)) {
        console.warn(`Retrying fetch for anime ${animeId}`);
        return await this.fetchAnimeWithRelated(animeId, visitedIds, seriesMap, userAnimeIds);
      }
      return null;
    }
  }

  private async displayAnimeList(animeList: AnimeNode[], username: string): Promise<void> {
    if (!this.container) return;
    
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
    const seriesMap = new Map<number, AnimeSeries>();
    const watchStatusMap = new Map<number, string>();

    animeList.forEach(anime => {
      if (anime.node.id && anime.list_status) {
        watchStatusMap.set(anime.node.id, anime.list_status.status);
      }
    });

    const userAnimeIds = new Set(animeList.map(anime => anime.node.id));

    const fetchPromises = animeList.map(anime => {
      if (!anime.node.id) return Promise.resolve();
      
      return this.fetchAnimeWithRelated(anime.node.id, new Set(), seriesMap, userAnimeIds)
        .then(details => {
          if (!details || !anime.node.id) return;
          
          if (anime.list_status) {
            details.list_status = anime.list_status;
          }
          
          this.fullAnimeData.set(anime.node.id, details);
          let series: AnimeSeries | null = null;
          let currentAnime: any = details;
          
          while (currentAnime) {
            if (seriesMap.has(currentAnime.id)) {
              series = seriesMap.get(currentAnime.id) || null;
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
        });
    });
    
    await Promise.all(fetchPromises);
    
    const uniqueSeries = [...new Set(seriesMap.values())].sort((a, b) =>
      (a.title || '').localeCompare(b.title || '')
    );
    
    if (this.container) {
      this.container.innerHTML += this.renderSeriesList(uniqueSeries, watchStatusMap);
    }
    
    const seriesCount = uniqueSeries.length;
    const headerElement = document.querySelector('.user-profile-header');
    if (headerElement) {
      headerElement.innerHTML = `
        <h2>${username}'s Anime List</h2>
        <span class="series-count">Series Count: ${seriesCount}</span>
      `;
    }
    
    const loadingElement = document.getElementById('loadingProgress');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  private renderSeriesList(uniqueSeries: AnimeSeries[], watchStatusMap: Map<number, string>): string {
    return uniqueSeries.map(series => `
      <div class="series-container">
        <h2 class="series-title">${series.title}</h2>
        <div class="anime-grid">
          ${series.animeList.map(anime => this.renderAnimeCard(anime, watchStatusMap)).join('')}
        </div>
      </div>
    `).join('');
  }

  private renderAnimeCard(anime: Anime, watchStatusMap: Map<number, string>): string {
    const userStatus = this.userStatusMap.get(anime.id) || { score: 0 } as AnimeListStatus;
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

  private handleError(error: Error): void {
    document.body.style.overflow = 'hidden';
    let errorMessage: string;
    
    if (error.message.includes('MAL API Error')) {
      errorMessage = 'User not found';
    } else {
      errorMessage = `Error fetching anime list: ${error.message}`;
    }
    
    if (this.container) {
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
    }
    
    const loadingElement = document.getElementById('loadingProgress');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    if (this.container) {
      this.container.style.display = 'block';
    }
  }

  getAnimeData(animeId: number): Anime | undefined {
    return this.fullAnimeData.get(animeId);
  }
}
