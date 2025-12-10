export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// get full URL for uploaded files/images
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, construct the full URL using the API base URL
  return `${API_BASE_URL}/uploads/${imagePath}`;
};

