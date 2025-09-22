// Centralized API URL configuration - only uses .env file
export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
};

export const getSocketUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:3001';
};