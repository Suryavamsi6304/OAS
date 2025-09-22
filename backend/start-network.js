const { spawn } = require('child_process');
const os = require('os');

// Get network IP
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const networkIP = getNetworkIP();
console.log(`🌐 Starting server for network access...`);
console.log(`📡 Server will be accessible at: http://${networkIP}:3001`);
console.log(`🖥️  Frontend should use: REACT_APP_API_URL=http://${networkIP}:3001`);

// Set environment variables
process.env.HOST = '0.0.0.0';
process.env.PORT = '3001';

// Start the server
const server = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});