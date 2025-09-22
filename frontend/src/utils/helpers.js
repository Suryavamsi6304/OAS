// Performance utilities
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Offline management
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingRequests = [];
    
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingRequests();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  queueRequest(request) {
    if (this.isOnline) return request();
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ request, resolve, reject });
    });
  }

  async processPendingRequests() {
    const requests = [...this.pendingRequests];
    this.pendingRequests = [];

    for (const { request, resolve, reject } of requests) {
      try {
        const result = await request();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
  }
}

export const offlineManager = new OfflineManager();