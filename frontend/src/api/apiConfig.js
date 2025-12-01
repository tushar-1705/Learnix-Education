export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

