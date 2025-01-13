import { AnimeList } from './components/AnimeList.js';
import { UserMenu } from './components/UserMenu.js';
import { handleAuthResponse } from './utils/auth.js';
import { AnimeService } from './services/animeService.js';

const initializeModal = () => {
    const existingModal = document.getElementById('animeModal');
    if (existingModal) {
        existingModal.remove();
    }
    document.body.insertAdjacentHTML('beforeend', `
        <div id="animeModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <div id="animeDetails"></div>
            </div>
        </div>
    `);
    const modal = document.getElementById('animeModal');
    const closeBtn = document.querySelector('.close');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
};

const initializeNavigation = () => {
    const navContent = document.querySelector('.nav-content');
    if (navContent) {
        navContent.innerHTML = `
            <h1><i class="fas fa-list-alt"></i>MyAnimeList Tracker</h1>
            <button class="search-button" onclick="window.location.href='/'">
                <i class="fas fa-search"></i>
                Search User
            </button>
            <div id="userMenu"></div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const animeService = new AnimeService();
        await animeService.fetchMALClientId();
        initializeNavigation();
        const { loggedInUser, userPicture } = handleAuthResponse();
        const userMenu = new UserMenu('userMenu');
        userMenu.render(loggedInUser, userPicture);
        if (!document.getElementById('loadingProgress')) {
            document.body.insertAdjacentHTML('afterbegin', `
                <div id="loadingProgress" class="loading-progress" style="display: none;">
                    <div class="progress-container"> 
                        <div class="loading-spinner"></div>
                        <div class="request-counter">Total Animes Fetched: 0</div>
                    </div>
                </div>
            `);
        }
        initializeModal();
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('username');
        const isAuthenticated = urlParams.get('authenticated') === 'true' || (username === localStorage.getItem('malUser'));
        const animeList = new AnimeList('animeList');
        await animeList.initialize(username, isAuthenticated);

        window.getAnimeDetails = async (animeId) => {
            try {
                const modal = document.getElementById('animeModal');
                const detailsContainer = document.getElementById('animeDetails');
                detailsContainer.innerHTML = 'Loading...';
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                let anime = animeList.getAnimeData(animeId);
                if (!anime) {
                    anime = await animeService.fetchAnimeDetails(animeId);
                }
                detailsContainer.innerHTML = `
                    <div class="anime-details-container">
                        <div class="anime-details-sidebar">
                            <div class="anime-details-name">
                                <h2>${anime.alternative_titles?.en || anime.title}</h2>
                            </div>
                            ${anime.main_picture ? `
                                <img src="${anime.main_picture.large}" 
                                     alt="${anime.title}" 
                                     class="anime-details-cover">
                            ` : ''}
                        </div>
                        <div class="anime-details-content">
                            <div class="detail-section">
                                <h3>Alternative Titles</h3>
                                <p>English: ${anime.alternative_titles?.en || 'N/A'}</p>
                                <p>Japanese: ${anime.alternative_titles?.ja || 'N/A'}</p>
                            </div>
                            <div class="detail-section">
                                <h3>Information</h3>
                                <p>Status: ${anime.status || 'N/A'}</p>
                                <p>Episodes: ${anime.num_episodes || 'N/A'}</p>
                                <p>Aired: ${anime.start_date || 'N/A'} to ${anime.end_date || 'N/A'}</p>
                                <p>Duration: ${anime.average_episode_duration ? Math.floor(anime.average_episode_duration / 60) : 'N/A'} minutes per episode</p>
                                <p>Source: ${anime.source || 'N/A'}</p>
                                <p>Rating: ${anime.rating || 'N/A'}</p>
                            </div>
                            <div class="detail-section">
                                <h3>Statistics</h3>
                                <p>Score: ${anime.mean || 'N/A'}</p>
                                <p>Rank: #${anime.rank || 'N/A'}</p>
                                <p>Popularity: #${anime.popularity || 'N/A'}</p>
                                <p>Members: ${anime.num_list_users ? anime.num_list_users.toLocaleString() : 'N/A'}</p>
                            </div>
                            <div class="detail-section">
                                <h3>Genres</h3>
                                <p>${anime.genres ? anime.genres.map(genre => genre.name).join(', ') : 'N/A'}</p>
                            </div>
                            <div class="detail-section">
                                <h3>Studios</h3>
                                <p>${anime.studios ? anime.studios.map(studio => studio.name).join(', ') : 'N/A'}</p>
                            </div>
                            <div class="detail-section">
                                <h3>Synopsis</h3>
                                <p>${anime.synopsis || 'No synopsis available.'}</p>
                            </div>
                            ${anime.background ? `
                                <div class="detail-section">
                                    <h3>Background</h3>
                                    <p>${anime.background}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('animeDetails').innerHTML = `
                    <p class="error">Error fetching anime details: ${error.message}</p>
                `;
            }
        };
    } catch (error) {
        console.error('Error initializing application:', error);
        const animeList = document.getElementById('animeList');
        if (animeList) {
            animeList.innerHTML = `
                <div class="error-container">
                    <div class="error-content">
                        <i class="fas fa-exclamation-circle error-icon"></i>
                        <p class="error-message">
                            Error initializing application: ${error.message}
                        </p>
                        <button onclick="window.location.href='/'" class="return-button">
                            <i class="fas fa-arrow-left"></i> Return to Home
                        </button>
                    </div>
                </div>
            `;
        }
    }
});