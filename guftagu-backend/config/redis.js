const { Redis } = require('@upstash/redis');

let redis = null;

const connectRedis = () => {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log('Redis Connected (Upstash)');
  } else {
    console.warn('Upstash Redis not configured, using in-memory storage for OTPs');
  }

  return redis;
};

const getRedis = () => redis;

// In-memory fallback for OTP storage when Redis is not available
const otpMemoryStore = new Map();

const storeOTP = async (email, otp, expiresInSeconds = 600) => {
  const key = `otp:${email}`;
  if (redis) {
    await redis.set(key, otp, { ex: expiresInSeconds });
  } else {
    otpMemoryStore.set(key, {
      otp,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    });
  }
};

const getOTP = async (email) => {
  const key = `otp:${email}`;
  if (redis) {
    return await redis.get(key);
  } else {
    const data = otpMemoryStore.get(key);
    if (data && data.expiresAt > Date.now()) {
      return data.otp;
    }
    otpMemoryStore.delete(key);
    return null;
  }
};

const deleteOTP = async (email) => {
  const key = `otp:${email}`;
  if (redis) {
    await redis.del(key);
  } else {
    otpMemoryStore.delete(key);
  }
};

module.exports = {
  connectRedis,
  getRedis,
  storeOTP,
  getOTP,
  deleteOTP,
};
