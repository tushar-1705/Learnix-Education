// API Configuration - Centralized location for API base URL
// This ensures all API calls use the same base URL from environment variables

// Get API base URL from environment variable
// Priority: 
// 1. VITE_API_BASE_URL from .env (deployed backend URL)
// 2. If running on localhost, use local backend, otherwise use deployed backend
// 3. Fallback to deployed backend URL
const getApiBaseUrl = () => {
  // If VITE_API_BASE_URL is set (from .env), use it (this is the deployed backend)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're running on localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // If on localhost, use local backend, otherwise use deployed backend
  return isLocalhost 
    ? "http://localhost:8082/api" 
    : "https://learnix-education.onrender.com/api";
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to get full URL for uploaded files/images
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, construct the full URL using the API base URL
  return `${API_BASE_URL}/uploads/${imagePath}`;
};

