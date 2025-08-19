import axios from 'axios';

// Get API URL from environment with fallback
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If no environment variable is set, determine based on current domain
  if (!envUrl) {
    const currentDomain = window.location.hostname;
    if (currentDomain.includes('nj.contractors')) {
      return 'https://app.nj.contractors';
    } else if (currentDomain.includes('njcontractors.com')) {
      return 'https://app.njcontractors.com';
    }
    return 'http://localhost:8080'; // Development fallback
  }
  
  return envUrl;
};

const api_url = getApiUrl();

const axiosInstance = axios.create({
  baseURL: api_url,
  withCredentials: true,
});

export default axiosInstance;