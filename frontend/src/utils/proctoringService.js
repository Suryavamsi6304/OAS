import { io } from 'socket.io-client';
import { getApiUrl } from './networkConfig';

class ProctoringService {
  constructor() {
    this.socket = null;
    this.localStream = null;
    this.isStreaming = false;
    this.sessionId = null;
    this.peerConnections = new Map();
  }

  async initialize(examId, studentId) {
    try {
      // Initialize socket connection
      const apiUrl = getApiUrl();
      console.log('Student connecting to socket server at:', apiUrl);
      this.socket = io(apiUrl, {
        transports: ['websocket', 'polling']
      });

      this.sessionId = `${examId}_${studentId}_${Date.now()}`;

      // Set up socket event listeners
      this.setupSocketListeners();

      // Get user media with high quality settings
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 720 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          facingMode: 'user'
        },
        audio: false
      });

      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize proctoring:', error);
      throw error;
    }
  }

  setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to proctoring server');
    });

    this.socket.on('mentor-joined', (data) => {
      console.log('Mentor joined stream:', data.mentorId);
      this.createPeerConnection(data.mentorId);
    });

    this.socket.on('mentor-left', () => {
      console.log('Mentor left stream');
    });

    this.socket.on('offer', async (data) => {
      await this.handleOffer(data);
    });

    this.socket.on('answer', async (data) => {
      await this.handleAnswer(data);
    });

    this.socket.on('ice-candidate', async (data) => {
      await this.handleIceCandidate(data);
    });
  }

  async startStreaming(examId, studentId, studentName, examTitle) {
    if (this.isStreaming) return;

    try {
      this.isStreaming = true;
      
      // Notify server that streaming started
      this.socket.emit('student-start-stream', {
        sessionId: this.sessionId,
        studentId,
        studentName: studentName || `Student ${studentId}`,
        examId,
        examTitle: examTitle || `Exam ${examId}`
      });

      // Start sending video frames
      this.startVideoCapture();
      
      console.log('Proctoring stream started');
    } catch (error) {
      console.error('Failed to start streaming:', error);
      this.isStreaming = false;
      throw error;
    }
  }

  stopStreaming() {
    if (!this.isStreaming) return;

    this.isStreaming = false;

    // Stop video capture
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connections
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();

    // Notify server
    if (this.socket) {
      this.socket.emit('student-stop-stream', {
        sessionId: this.sessionId
      });
      this.socket.disconnect();
    }

    console.log('Proctoring stream stopped');
  }

  startVideoCapture() {
    if (!this.localStream || !this.isStreaming) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const video = document.createElement('video');
    
    video.srcObject = this.localStream;
    video.muted = true;
    video.play();

    const captureFrame = () => {
      if (!this.isStreaming) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        if (this.socket && this.socket.connected) {
          this.socket.emit('video-frame', {
            sessionId: this.sessionId,
            frameData: dataURL,
            timestamp: Date.now()
          });
        }
      }

      setTimeout(captureFrame, 100); // 10 FPS for smoother streaming
    };

    video.addEventListener('loadeddata', () => {
      console.log('Video loaded, starting capture');
      captureFrame();
    });
  }

  async createPeerConnection(mentorId) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    this.peerConnections.set(mentorId, peerConnection);

    // Add local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          sessionId: this.sessionId,
          candidate: event.candidate,
          mentorId
        });
      }
    };

    // Create and send offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    this.socket.emit('offer', {
      sessionId: this.sessionId,
      offer,
      mentorId
    });
  }

  async handleOffer(data) {
    const peerConnection = this.peerConnections.get(data.mentorId);
    if (!peerConnection) return;

    await peerConnection.setRemoteDescription(data.offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    this.socket.emit('answer', {
      sessionId: this.sessionId,
      answer,
      mentorId: data.mentorId
    });
  }

  async handleAnswer(data) {
    const peerConnection = this.peerConnections.get(data.mentorId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(data.answer);
    }
  }

  async handleIceCandidate(data) {
    const peerConnection = this.peerConnections.get(data.mentorId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(data.candidate);
    }
  }

  getLocalStream() {
    return this.localStream;
  }

  isActive() {
    return this.isStreaming;
  }
}

export default new ProctoringService();