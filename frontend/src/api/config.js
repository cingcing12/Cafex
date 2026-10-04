import axios from 'axios';

// Connecting to your secure DuckDNS domain!
const API_URL = 'https://cafex-homework.duckdns.org/api';   

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "69420" // Skips the Ngrok warning page
  }
});

export default api;