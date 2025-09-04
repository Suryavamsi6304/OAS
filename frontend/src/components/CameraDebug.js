import React, { useRef, useEffect, useState } from 'react';

const CameraDebug = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Starting...');
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    getDevices();
    testCamera();
  }, []);

  const getDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const cameras = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(cameras);
      console.log('Available cameras:', cameras);
    } catch (error) {
      console.error('Device enumeration failed:', error);
    }
  };

  const testCamera = async (deviceId = null) => {
    try {
      setStatus('Requesting camera...');
      
      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setStatus('Camera working');
        };
      }
    } catch (error) {
      console.error('Camera test failed:', error);
      setStatus(`Error: ${error.name} - ${error.message}`);
    }
  };

  const switchCamera = (deviceId) => {
    setSelectedDevice(deviceId);
    testCamera(deviceId);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Camera Debug Tool</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '400px',
            height: '300px',
            border: '2px solid #ccc',
            backgroundColor: '#000'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Available Cameras:</h3>
        {devices.map((device, index) => (
          <div key={device.deviceId} style={{ marginBottom: '10px' }}>
            <button
              onClick={() => switchCamera(device.deviceId)}
              style={{
                padding: '10px',
                marginRight: '10px',
                backgroundColor: selectedDevice === device.deviceId ? '#007bff' : '#f8f9fa',
                color: selectedDevice === device.deviceId ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              Camera {index + 1}
            </button>
            <span>{device.label || `Camera ${index + 1}`}</span>
          </div>
        ))}
      </div>

      <div>
        <button
          onClick={() => testCamera()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px'
          }}
        >
          Test Default Camera
        </button>
        
        <button
          onClick={getDevices}
          style={{
            padding: '10px 20px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Refresh Devices
        </button>
      </div>
    </div>
  );
};

export default CameraDebug;