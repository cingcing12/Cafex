import axios from 'axios';

// Connecting to your DuckDNS domain directly on port 5000
const API_URL = 'http://cafex-homework.duckdns.org:5000/api';   

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "69420" // Skips the Ngrok warning page
  }
});

export default api;