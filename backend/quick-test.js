const express = require('express');
const { connectDB } = require('./config/database');

async function quickTest() {
  try {
    console.log('Testing database connection...');
    await connectDB();
    console.log('✅ Database connected successfully!');
    
    const app = express();
    const server = app.listen(3000, () => {
      console.log('✅ Server running on port 3000');
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

quickTest();