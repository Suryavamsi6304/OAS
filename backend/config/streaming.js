// Production streaming configuration
module.exports = {
  // Use WebRTC for direct peer-to-peer streaming
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN servers for production
      // { urls: 'turn:your-turn-server.com', username: 'user', credential: 'pass' }
    ]
  },
  
  // Video constraints for production
  video: {
    width: { ideal: 640, max: 1280 },
    height: { ideal: 480, max: 720 },
    frameRate: { ideal: 15, max: 30 }
  },
  
  // Compression settings
  compression: {
    quality: 0.7,
    format: 'webp'
  }
};