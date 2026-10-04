import axios from 'axios';

// Connecting to the backend on your VM!
const API_URL = 'http://192.168.91.129:5000/api';  

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    "ngrok-skip-browser-warning": "69420" // Skips the Ngrok warning page
  }
});

export default api;