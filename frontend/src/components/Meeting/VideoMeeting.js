import React, { useState, useRef, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, Users, MessageSquare, Share, Settings, Maximize, UserPlus, Shield, Monitor } from 'lucide-react';

const VideoMeeting = ({ meetingId, onEndMeeting, isHost = false, userName = 'You' }) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [waitingRoom, setWaitingRoom] = useState([]);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  useEffect(() => {
    startLocalVideo();
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
        setIsVideoOn(!isVideoOn);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioOn;
        setIsAudioOn(!isAudioOn);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      screenStreamRef.current = screenStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }
      setIsScreenSharing(true);
      
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
    setIsScreenSharing(false);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: userName,
        text: newMessage,
        timestamp: new Date()
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    }
  };

  const admitParticipant = (participantId) => {
    const participant = waitingRoom.find(p => p.id === participantId);
    if (participant) {
      setParticipants([...participants, participant]);
      setWaitingRoom(waitingRoom.filter(p => p.id !== participantId));
    }
  };

  const removeParticipant = (participantId) => {
    setParticipants(participants.filter(p => p.id !== participantId));
  };

  // Simulate participants joining
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaitingRoom([
        { id: 1, name: 'John Doe', avatar: 'JD' },
        { id: 2, name: 'Jane Smith', avatar: 'JS' }
      ]);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: '#0f172a', 
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar */}
      <div style={{ 
        padding: '12px 20px', 
        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#10b981',
            animation: 'pulse 2s infinite'
          }} />
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Live Session</span>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>ID: {meetingId}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
            <Users size={14} />
            <span>1 participant</span>
          </div>
          <button
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '4px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <Maximize size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        position: 'relative'
      }}>
        {/* Video Area */}
        <div style={{ 
          flex: showChat ? '0 0 70%' : '1',
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}>
          <div style={{ 
            position: 'relative', 
            backgroundColor: '#1e293b', 
            borderRadius: '12px', 
            overflow: 'hidden',
            width: '100%',
            maxWidth: '900px',
            aspectRatio: '16/9',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                display: isVideoOn ? 'block' : 'none'
              }}
            />
            {!isVideoOn && (
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#1e293b'
              }}>
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%', 
                  backgroundColor: '#3b82f6', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: '600',
                  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)'
                }}>
                  You
                </div>
              </div>
            )}
            
            {/* Video Overlay Info */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: '8px 12px',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isAudioOn ? '#10b981' : '#ef4444'
              }} />
              {userName} {!isAudioOn && '(muted)'} {isScreenSharing && '(sharing)'}
            </div>
            
            {/* Participants Grid */}
            {participants.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {participants.map(participant => (
                  <div key={participant.id} style={{
                    width: '120px',
                    height: '80px',
                    backgroundColor: '#374151',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      {participant.avatar}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      fontSize: '10px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      padding: '2px 4px',
                      borderRadius: '4px'
                    }}>
                      {participant.name}
                    </div>
                    {isHost && (
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div style={{
            width: '30%',
            backgroundColor: '#1e293b',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontWeight: '500',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              Chat
              {isHost && waitingRoom.length > 0 && (
                <span style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {waitingRoom.length}
                </span>
              )}
            </div>
            
            {/* Waiting Room (Host Only) */}
            {isHost && waitingRoom.length > 0 && (
              <div style={{
                padding: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: '#374151'
              }}>
                <div style={{ color: '#f59e0b', fontSize: '12px', marginBottom: '8px' }}>Waiting Room</div>
                {waitingRoom.map(participant => (
                  <div key={participant.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 0',
                    fontSize: '13px',
                    color: 'white'
                  }}>
                    <span>{participant.name}</span>
                    <button
                      onClick={() => admitParticipant(participant.id)}
                      style={{
                        padding: '2px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Admit
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
              {chatMessages.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>
                  No messages yet
                </div>
              ) : (
                chatMessages.map(message => (
                  <div key={message.id} style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                      {message.sender} • {message.timestamp.toLocaleTimeString()}
                    </div>
                    <div style={{ fontSize: '13px', color: 'white' }}>
                      {message.text}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Chat Input */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#374151',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ 
        padding: '16px 20px', 
        backgroundColor: 'rgba(15, 23, 42, 0.95)', 
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '12px' 
      }}>
        <button
          onClick={toggleAudio}
          style={{
            padding: '14px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isAudioOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isAudioOn ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          onClick={toggleVideo}
          style={{
            padding: '14px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isVideoOn ? 'rgba(255,255,255,0.1)' : '#ef4444',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          style={{
            padding: '14px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: showChat ? '#3b82f6' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
        >
          <MessageSquare size={18} />
          {chatMessages.length > 0 && !showChat && (
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              width: '12px',
              height: '12px',
              fontSize: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {chatMessages.length}
            </span>
          )}
        </button>

        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          style={{
            padding: '14px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: isScreenSharing ? '#3b82f6' : 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Monitor size={18} />
        </button>

        {isHost && (
          <button
            style={{
              padding: '14px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Shield size={18} />
            {waitingRoom.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '12px',
                height: '12px',
                fontSize: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {waitingRoom.length}
              </span>
            )}
          </button>
        )}

        <button
          style={{
            padding: '14px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Settings size={18} />
        </button>

        <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 8px' }} />

        <button
          onClick={onEndMeeting}
          style={{
            padding: '12px 20px',
            borderRadius: '24px',
            border: 'none',
            backgroundColor: '#ef4444',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <Phone size={16} />
          End
        </button>
      </div>
    </div>
  );
};

export default VideoMeeting;