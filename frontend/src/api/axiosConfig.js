import axios from "axios";

// Get API base URL from environment variable
// Priority: 
// 1. VITE_API_BASE_URL from .env (deployed backend URL)
// 2. If running on localhost, check if local backend is available, otherwise use deployed URL
// 3. Fallback to localhost for development
// const getApiBaseUrl = () => {
//   // If VITE_API_BASE_URL is set (from .env), use it (this is the deployed backend)
//   if (import.meta.env.VITE_API_BASE_URL) {
//     return import.meta.env.VITE_API_BASE_URL;
//   }
  
//   // Check if we're running on localhost
//   const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
//   // If on localhost, use local backend, otherwise use deployed backend
//   return isLocalhost 
//     ? "http://localhost:8082/api" 
//     : "https://learnix-education.onrender.com/api";
// };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



const API = axios.create({
  baseURL: API_BASE_URL,
});

// Add JWT token to requests
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) 
    {
      req.headers.Authorization = `Bearer ${token}`;
    }
  return req;
});

export default API;
