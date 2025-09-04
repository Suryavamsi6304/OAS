const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Simple inline controller to avoid import issues
const executeCode = async (req, res) => {
  try {
    const { code, language, input = '', testCases = [] } = req.body;
    
    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: 'Code and language are required' 
      });
    }

    // Mock response for now
    const mockResult = {
      input: input || 'test input',
      expectedOutput: 'test output',
      actualOutput: 'test output',
      error: null,
      executionTime: 45.2,
      passed: true
    };

    res.json({
      success: true,
      results: [mockResult],
      allPassed: true,
      totalTests: 1,
      passedTests: 1
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Execute code
router.post('/execute', auth, executeCode);

module.exports = router;