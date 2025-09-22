import axios from 'axios';
import { offlineManager } from '../utils/helpers';

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Handle network errors
        if (!error.response) {
          // Store request for retry when online
          if (!originalRequest._offline) {
            originalRequest._offline = true;
            return offlineManager.queueRequest(() => this.client(originalRequest));
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async request(config, retries = 2) {
    try {
      const response = await this.client(config);
      return response.data;
    } catch (error) {
      if (retries > 0 && (!error.response || error.response.status >= 500)) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.request(config, retries - 1);
      }
      throw error;
    }
  }

  // HTTP methods
  get(url, config = {}) {
    return this.request({ ...config, method: 'GET', url });
  }

  post(url, data, config = {}) {
    return this.request({ ...config, method: 'POST', url, data });
  }

  put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }
}

export default new ApiClient();