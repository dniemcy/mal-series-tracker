import { handleAuthResponse } from './utils/auth.js';
import { UserMenu } from './components/UserMenu.js';

document.addEventListener('DOMContentLoaded', () => {
  const { loggedInUser, userPicture } = handleAuthResponse();
  const userMenu = new UserMenu('userMenu');
  userMenu.render(loggedInUser, userPicture);
  
  const app = document.getElementById('app');
  if (!app) return;
  
  const content = `
    <div class="container">
      <form id="malForm" novalidate autocomplete="off">
        <div class="input-group">
          <i class="fas fa-user"></i>
          <input type="text" id="username" placeholder="Enter MyAnimeList username" required autocomplete="off">
        </div>
        <button type="submit" class="submit-button"><i class="fas fa-paper-plane"></i>Submit</button>
      </form>
      ${!loggedInUser ? `
        <div class="divider">
          <span>or</span>
        </div>
        <button type="button" id="authButton" class="auth-button">
          <i class="fas fa-lock"></i>Authenticate User
        </button>
      ` : ''}
    </div>
  `;
  
  app.innerHTML = content;
  
  const form = document.getElementById('malForm') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const usernameInput = document.getElementById('username') as HTMLInputElement | null;
      const username = usernameInput?.value.trim() || '';
      
      if (!username) {
        if (usernameInput) {
          usernameInput.classList.add('error');
        }
        return;
      }

      const isAuthenticated = username === localStorage.getItem('malUser');
      window.location.href = `/animelist.html?username=${encodeURIComponent(username)}&authenticated=${isAuthenticated}`;
    });
  }
  
  const authButton = document.getElementById('authButton');
  if (authButton) {
    authButton.addEventListener('click', () => {
      window.location.href = '/auth/mal';
    });
  }
});
