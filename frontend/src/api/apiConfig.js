// API Configuration - Centralized location for API base URL
// This ensures all API calls use the same base URL from environment variables

// Get API base URL from environment variable, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8082/api";

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

