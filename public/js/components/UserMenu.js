export class UserMenu {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.dropdownVisible = false;
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    render(user, picture) {
        if (!user || !this.container) return;
        this.container.innerHTML = `
            <div class="profile-dropdown">
                <div class="profile-trigger">
                    <img src="${picture || '/api/placeholder/80/80'}" alt="Profile" class="profile-picture">
                    <span class="username">${user}</span>
                </div>
                <div class="dropdown-content" id="profileDropdown">
                    <button id="userListButton" class="auth-button">
                        <i class="fas fa-user"></i>Display My List
                    </button>
                    <button id="logoutButton" class="logout-button">
                        <i class="fas fa-sign-out-alt"></i>Logout
                    </button>
                </div>
            </div>
        `;
        this.attachEventListeners();
    }

    attachEventListeners() {
        const trigger = this.container.querySelector('.profile-trigger');
        const dropdown = this.container.querySelector('.dropdown-content');
        const logoutButton = document.getElementById('logoutButton');
        const userListButton = document.getElementById('userListButton');
        document.removeEventListener('click', this.handleClickOutside);
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown(dropdown);
            });
        }
        document.addEventListener('click', this.handleClickOutside);
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('malToken');
                localStorage.removeItem('malUser');
                localStorage.removeItem('malPicture');
                window.location.href = '/';
            });
        }
        if (userListButton) {
            userListButton.addEventListener('click', () => {
                const currentUser = localStorage.getItem('malUser');
                if (currentUser) {
                    window.location.href = `/animelist.html?username=${encodeURIComponent(currentUser)}&authenticated=true`;
                }
            });
        }
    }

    toggleDropdown(dropdown) {
        if (!dropdown) return;
        this.dropdownVisible = !this.dropdownVisible;
        dropdown.classList.toggle('show');
    }

    handleClickOutside(event) {
        if (this.dropdownVisible && !event.target.closest('.profile-dropdown')) {
            const dropdown = this.container.querySelector('.dropdown-content');
            if (dropdown) {
                dropdown.classList.remove('show');
                this.dropdownVisible = false;
            }
        }
    }
}