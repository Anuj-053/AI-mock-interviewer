import axios from 'axios';

let rawBaseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
rawBaseURL = rawBaseURL.trim();
if (!rawBaseURL.endsWith('/api') && !rawBaseURL.endsWith('/api/')) {
    rawBaseURL = rawBaseURL.replace(/\/+$/, '') + '/api';
}

// 1. Create a custom Axios instance pointing to our backend API
const api = axios.create({
    baseURL: rawBaseURL,
});

// 2. Add an "interceptor" to automatically attach our JWT token to every request
api.interceptors.request.use((config) => {
    // Look for the token in the browser's localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    // If we have a token, add it to the Authorization header
    if (userInfo && userInfo.token) {
        config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
});

export default api;
