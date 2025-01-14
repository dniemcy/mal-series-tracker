# MyAnimeList Series Tracker
Organize and track anime series from MyAnimeList with automatic sequel grouping and detailed information display.

## Features
* **Series Grouping:** Automatically groups entries in the same series chronologically
* **Detailed Information:** Access comprehensive anime details, by clicking any displayed entry
* **MyAnimeList Integration:** View any user's list or login with MAL account
* **Responsive Design:** Fully functional on both desktop and mobile devices

## Live Demo
[mal-series-tracker](https://mal-series-tracker.onrender.com/)

## Built With
- Node.js/Express.js - Backend server and API handling
- JavaScript - Frontend functionality and series grouping
- HTML/CSS - Structure and styling
- MyAnimeList API - Data source and authentication

## Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/anime-list-plus.git

# Navigate to directory
cd anime-list-plus

# Install dependencies
npm install

# Create .env file with required variables:
MAL_CLIENT_ID=your_client_id
MAL_CLIENT_SECRET=your_client_secret
BASE_URL=http://localhost:3000
SESSION_SECRET=your_session_secret
PORT=3000

# Start the server
npm start
```

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Acknowledgments
* [MyAnimeList API](https://myanimelist.net/apiconfig/references/api/v2): Data source and OAuth2 authentication

## Task List
- [ ] Add sorting options for series list
- [ ] Implement data caching system
- [ ] Batch add to plan to watch list
- [ ] CSS changes for modal
- [ ] Recommendation system
- [ ] User statistics

Note: Application uses MAL API v2 beta which has rate limits and potential downtime. The rate of requests is currently quite slow to avoid this, but I hope to store data in the future.
