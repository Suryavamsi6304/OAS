# Network Access Setup Guide

## Quick Setup

1. **Start for network access**: Run `start-network.bat` (not start.bat)
2. **Share the URL**: Give your friend the network URL shown in the console
3. **Test connection**: Open `test-network.html` to verify connectivity

## Important URLs

- **Main Platform**: `http://YOUR_IP:3001`
- **Admin Panel**: `http://YOUR_IP:3001/admin`
- **Teacher Panel**: `http://YOUR_IP:3001/teacher`
- **Student Panel**: `http://YOUR_IP:3001/student`
- **Connection Test**: `http://YOUR_IP:3001/test-network.html`

## Troubleshooting

### If friend gets 404 errors:
- Make sure they're using port **3001**
- URL should be: `http://YOUR_IP:3001`

### If firewall blocks access:
```cmd
netsh advfirewall firewall add rule name="Assessment Platform" dir=in action=allow protocol=TCP localport=3001
```

### Common Issues:
1. **Wrong URL**: Friend should use `http://YOUR_IP:3001`
2. **Firewall**: Allow port 3001
3. **Network**: Both devices must be on same WiFi/LAN
4. **IP Address**: Use 192.168.x.x or 10.x.x.x (not 127.0.0.1)

## Default Login Credentials
- **Admin**: admin@assessment.com / password
- **Teacher**: teacher@assessment.com / password  
- **Student**: student@assessment.com / password