const express = require('express');
const { Batch } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get all batches
router.get('/', async (req, res) => {
  try {
    const batches = await Batch.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: batches });
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Create batch (Admin only)
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { code, name, description } = req.body;
    
    const batch = await Batch.create({
      code,
      name,
      description,
      createdBy: req.user.id
    });
    
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    console.error('Create batch error:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ success: false, error: 'Batch code already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

// Update batch (Admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { code, name, description, isActive } = req.body;
    
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    
    await batch.update({ code, name, description, isActive });
    
    res.json({ success: true, data: batch });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete batch (Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const batch = await Batch.findByPk(req.params.id);
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    
    await batch.update({ isActive: false });
    
    res.json({ success: true, message: 'Batch deactivated successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;