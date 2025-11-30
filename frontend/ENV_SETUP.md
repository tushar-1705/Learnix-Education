# Environment Configuration Guide

## API Base URL Configuration

The frontend is configured to work with both localhost and deployed backend URLs.

### Current Setup

1. **Deployed Backend (Default)**: `https://learnix-education.onrender.com/api`
   - This is set in `.env` file as `VITE_API_BASE_URL`
   - Used by default when the frontend is running

2. **Localhost Backend (Fallback)**: `http://localhost:8082/api`
   - Used automatically when:
     - `.env` file doesn't exist or `VITE_API_BASE_URL` is not set
     - AND the frontend is running on localhost

### How It Works

The API configuration (`src/api/axiosConfig.js`) follows this priority:

1. **First Priority**: Uses `VITE_API_BASE_URL` from `.env` file (deployed backend)
2. **Second Priority**: If no `.env` value, detects if running on localhost:
   - If localhost → uses `http://localhost:8082/api`
   - If deployed → uses `https://learnix-education.onrender.com/api`

### For Local Development with Local Backend

If you want to use your local backend when developing locally, you can:

**Option 1**: Create `.env.local` file (this overrides `.env`):
```
VITE_API_BASE_URL=http://localhost:8082/api
```

**Option 2**: Temporarily comment out or remove `VITE_API_BASE_URL` from `.env`

### For Production/Deployment

Keep `.env` with the deployed backend URL:
```
VITE_API_BASE_URL=https://learnix-education.onrender.com/api
```

### CORS Configuration

The backend CORS is configured to allow requests from:
- All localhost ports (5173, 5174, 3000)
- Any deployed frontend URL (using wildcard pattern)

This ensures your frontend works whether it's running locally or deployed.

