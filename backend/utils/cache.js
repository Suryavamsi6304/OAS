const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map();
  }

  async connect() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Redis connected successfully');
    } catch (error) {
      console.warn('Redis connection failed, using memory cache:', error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (this.isConnected) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Redis get error:', error);
      }
    }

    const memoryValue = this.memoryCache.get(key);
    if (memoryValue && memoryValue.expires > Date.now()) {
      return memoryValue.data;
    }
    if (memoryValue) this.memoryCache.delete(key);
    return null;
  }

  async set(key, value, ttl = 3600) {
    if (this.isConnected) {
      try {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } catch (error) {
        console.error('Redis set error:', error);
      }
    }

    this.memoryCache.set(key, {
      data: value,
      expires: Date.now() + (ttl * 1000)
    });
  }

  async del(key) {
    if (this.isConnected) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error('Redis del error:', error);
      }
    }
    this.memoryCache.delete(key);
  }

  // Exam-specific methods
  async getExam(examId) {
    return await this.get(`exam:${examId}`);
  }

  async setExam(examId, examData) {
    await this.set(`exam:${examId}`, examData, 1800);
  }

  async getUserResults(userId) {
    return await this.get(`user_results:${userId}`);
  }

  async setUserResults(userId, results) {
    await this.set(`user_results:${userId}`, results, 600);
  }

  async invalidateUser(userId) {
    await this.del(`user_results:${userId}`);
  }
}

module.exports = new RedisClient();