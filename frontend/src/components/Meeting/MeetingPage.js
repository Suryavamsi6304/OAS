import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Monitor, Settings, Users, MoreHorizontal, Hand, Record } from 'lucide-react';
import axios from 'axios';

const MeetingPage = () => {
  const navigate = useNavigate();
  const { meetingId } = useParams();
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([]);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    initializeWebRTC();
    return () => {
      cleanup();
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      // Initialize Socket.IO
      const io = await import('socket.io-client');
      const { getSocketUrl } = require('../../utils/networkConfig');
      socketRef.current = io.default(getSocketUrl());
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Set initial states based on actual tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      if (videoTrack) {
        setIsVideoOn(videoTrack.enabled);
      }
      if (audioTrack) {
        setIsAudioOn(audioTrack.enabled);
      }
      
      // Join meeting room
      socketRef.current.emit('join-meeting', { meetingId, userId: Date.now() });
      
      // Setup Socket listeners
      setupSocketListeners();
      
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  };

  const createPeerConnection = (userId) => {
    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    };
    
    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.set(userId, event.streams[0]);
        return newMap;
      });
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          meetingId,
          candidate: event.candidate,
          targetUserId: userId
        });
      }
    };
    
    peerConnectionsRef.current.set(userId, peerConnection);
    return peerConnection;
  };

  const setupSocketListeners = () => {
    socketRef.current.on('user-joined', async (data) => {
      const newUser = { ...data.user, isAudioOn: true, isVideoOn: true };
      setParticipants(prev => [...prev, newUser]);
      
      // Create peer connection and offer for new user
      const peerConnection = createPeerConnection(data.user.id);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socketRef.current.emit('offer', { meetingId, offer, targetUserId: data.user.id });
    });
    
    socketRef.current.on('offer', async (data) => {
      // Only handle offers not meant for us
      if (data.targetUserId && data.targetUserId !== socketRef.current.id) return;
      
      const peerConnection = createPeerConnection(data.userId);
      await peerConnection.setRemoteDescription(data.offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socketRef.current.emit('answer', { meetingId, answer, targetUserId: data.userId });
    });
    
    socketRef.current.on('answer', async (data) => {
      // Only handle answers meant for us
      if (data.targetUserId && data.targetUserId !== socketRef.current.id) return;
      
      const peerConnection = peerConnectionsRef.current.get(data.userId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
      }
    });
    
    socketRef.current.on('ice-candidate', async (data) => {
      // Only handle candidates meant for us
      if (data.targetUserId && data.targetUserId !== socketRef.current.id) return;
      
      const peerConnection = peerConnectionsRef.current.get(data.userId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate);
      }
    });
    
    socketRef.current.on('user-left', (data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
      setRemoteStreams(prev => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      
      // Close peer connection
      const peerConnection = peerConnectionsRef.current.get(data.userId);
      if (peerConnection) {
        peerConnection.close();
        peerConnectionsRef.current.delete(data.userId);
      }
    });
    
    socketRef.current.on('chat-message', (data) => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        sender: data.sender,
        text: data.message,
        timestamp: new Date()
      }]);
    });
    
    socketRef.current.on('user-toggle-audio', (data) => {
      setParticipants(prev => prev.map(p => 
        p.id === data.userId ? { ...p, isAudioOn: data.isAudioOn } : p
      ));
    });
    
    socketRef.current.on('user-toggle-video', (data) => {
      setParticipants(prev => prev.map(p => 
        p.id === data.userId ? { ...p, isVideoOn: data.isVideoOn } : p
      ));
    });
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        const newVideoState = !videoTrack.enabled;
        videoTrack.enabled = newVideoState;
        setIsVideoOn(newVideoState);
        
        // Notify other participants
        socketRef.current.emit('toggle-video', {
          meetingId,
          isVideoOn: newVideoState
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const newAudioState = !audioTrack.enabled;
        audioTrack.enabled = newAudioState;
        setIsAudioOn(newAudioState);
        
        // Notify other participants
        socketRef.current.emit('toggle-audio', {
          meetingId,
          isAudioOn: newAudioState
        });
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
      
      screenStream.getVideoTracks()[0].onended = () => {
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsScreenSharing(false);
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        sender: 'You',
        message: newMessage.trim()
      };
      
      // Send to other participants
      socketRef.current.emit('chat-message', {
        meetingId,
        ...message
      });
      
      // Add to local chat
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'You',
        text: newMessage.trim(),
        timestamp: new Date()
      }]);
      
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const leaveMeeting = async () => {
    // Notify other participants
    socketRef.current.emit('leave-meeting', { meetingId });
    
    // End meeting for all participants (only mentors can end meetings)
    try {
      // Extract batch codes from meeting ID or get from stored meeting data
      const batches = ['BATCH001', 'BATCH002']; // This should come from meeting context
      await axios.post('/api/meetings/end', {
        meetingId,
        batches
      });
    } catch (error) {
      console.error('Failed to end meeting:', error);
    }
    
    // Cleanup and navigate
    cleanup();
    navigate(-1);
  };

  return (
    <div style={{
      height: '100vh',
      backgroundColor: '#292929',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'Segoe UI, system-ui, sans-serif'
    }}>
      {/* Teams Header */}
      <div style={{
        height: '48px',
        backgroundColor: '#464775',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: 'white',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>Meeting</div>
          <div style={{ fontSize: '12px', color: '#c7c7c7' }}>•</div>
          <div style={{ fontSize: '12px', color: '#c7c7c7' }}>{participants.length + 1} people</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#c7c7c7' }}>ID: {meetingId}</div>
          <button 
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            style={{ 
              padding: '4px 8px', 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              borderRadius: '4px',
              fontSize: '11px'
            }}
          >
            Copy Link
          </button>
        </div>
      </div>

      {/* Main Meeting Area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Video Area */}
        <div style={{
          flex: showChat ? '0 0 calc(100% - 320px)' : '1',
          position: 'relative',
          backgroundColor: '#292929',
          minHeight: 0
        }}>
          {/* Participants Grid */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            right: showChat ? '8px' : '8px',
            bottom: '88px',
            display: 'grid',
            gridTemplateColumns: participants.length <= 1 ? '1fr' : participants.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gridTemplateRows: participants.length <= 2 ? '1fr' : participants.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: '8px'
          }}>
            {participants.length === 0 ? (
              <div style={{
                backgroundColor: '#1f1f1f',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px'
              }}>
                Waiting for participants...
              </div>
            ) : (
              participants.map((participant) => {
                const stream = remoteStreams.get(participant.id);
                return (
                  <div key={participant.id} style={{
                    backgroundColor: '#1f1f1f',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    minHeight: '200px'
                  }}>
                    {participant.isVideoOn && stream ? (
                      <video
                        autoPlay
                        playsInline
                        ref={(el) => {
                          if (el && stream) {
                            el.srcObject = stream;
                          }
                        }}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#1f1f1f'
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: '#6264a7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '24px',
                          fontWeight: '600'
                        }}>
                          {participant.name?.charAt(0) || 'U'}
                        </div>
                      </div>
                    )}
                    
                    {/* Participant name */}
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {participant.name || `User ${participant.id.slice(-4)}`}
                    </div>
                    
                    {/* Audio indicator */}
                    {!participant.isAudioOn && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#cc4125',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <MicOff size={12} color="white" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Local Video (Picture-in-Picture) */}
          <div style={{
            position: 'absolute',
            bottom: '100px',
            right: '20px',
            width: '160px',
            height: '120px',
            backgroundColor: '#1f1f1f',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid #404040',
            zIndex: 10
          }}>
            {isVideoOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)'
                }}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1f1f1f'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: '#6264a7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  Y
                </div>
              </div>
            )}
            
            {/* Local user name */}
            <div style={{
              position: 'absolute',
              bottom: '6px',
              left: '6px',
              backgroundColor: 'rgba(0,0,0,0.8)',
              padding: '2px 6px',
              borderRadius: '3px',
              color: 'white',
              fontSize: '10px',
              fontWeight: '500'
            }}>
              You
            </div>
            
            {/* Local audio indicator */}
            {!isAudioOn && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                backgroundColor: '#cc4125',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MicOff size={10} color="white" />
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div style={{
            width: '320px',
            backgroundColor: '#f3f2f1',
            borderLeft: '1px solid #e1dfdd',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #e1dfdd',
              backgroundColor: 'white',
              fontSize: '16px',
              fontWeight: '600',
              color: '#323130'
            }}>
              Chat
            </div>
            
            <div style={{ 
              flex: 1, 
              padding: '16px', 
              overflowY: 'auto', 
              backgroundColor: '#f3f2f1',
              minHeight: 0
            }}>
              {chatMessages.map(message => (
                <div key={message.id} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#605e5c', marginBottom: '4px' }}>
                    {message.sender} • {message.timestamp.toLocaleTimeString()}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#323130',
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #e1dfdd',
                    wordWrap: 'break-word'
                  }}>
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderTop: '1px solid #e1dfdd'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e1dfdd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: newMessage.trim() ? '#6264a7' : '#ccc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '14px'
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Teams Bottom Controls */}
      <div style={{
        height: '80px',
        backgroundColor: '#292929',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '0 20px',
        flexShrink: 0
      }}>
        <button
          onClick={toggleAudio}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isAudioOn ? '#484644' : '#cc4125',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          {isAudioOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleVideo}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isVideoOn ? '#484644' : '#cc4125',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <button
          onClick={startScreenShare}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isScreenSharing ? '#6264a7' : '#484644',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          <Monitor size={20} />
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: showChat ? '#6264a7' : '#484644',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          <MessageSquare size={20} />
        </button>

        <button
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#484644',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Hand size={20} />
        </button>

        <button
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#484644',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MoreHorizontal size={20} />
        </button>

        <div style={{ width: '1px', height: '32px', backgroundColor: '#484644', margin: '0 8px' }} />

        <button
          onClick={leaveMeeting}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#cc4125',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
        >
          <Phone size={20} />
        </button>
      </div>
    </div>
  );
};

export default MeetingPage;