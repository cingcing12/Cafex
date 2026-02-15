import axios from 'axios';

// 👇 I updated this with your specific Ngrok URL
const API_URL = 'https://tutto-joyously-alayna.ngrok-free.dev/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "69420" // Skips the Ngrok warning page
  }
});

export default api;