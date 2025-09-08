// Simple server for Render deployment
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://monumental-kataifi-3b4c02.netlify.app'],
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'OAS Backend is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});