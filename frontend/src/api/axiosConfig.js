import axios from "axios";

// Get API base URL from environment variable, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8082/api";

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
