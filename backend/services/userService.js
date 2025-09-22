const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { Op } = require('sequelize');

class UserService {
  async getUsers() {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'name', 'role', 'batchCode', 'isApproved', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return users.map(user => ({
      ...user.toJSON(),
      isActive: true // Default since we don't have this field yet
    }));
  }

  async createUser(userData) {
    const { username, email, password, name, role, batchCode } = userData;

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      name,
      role,
      batchCode,
      isApproved: true // Auto-approve admin-created users
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async updateUser(id, userData) {
    const { username, email, name, role, batchCode } = userData;

    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check for duplicate username/email (excluding current user)
    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { id: { [Op.ne]: id } },
          { [Op.or]: [{ username }, { email }] }
        ]
      }
    });

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    await user.update({
      username,
      email,
      name,
      role,
      batchCode
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword;
  }

  async deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.role === 'admin') {
      throw new Error('Cannot delete admin users');
    }

    await user.destroy();
    return { message: 'User deleted successfully' };
  }

  async approveUser(id, approved, approvedBy) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (approved) {
      await user.update({
        isApproved: true,
        approvedBy,
        approvedAt: new Date()
      });
      return { message: 'User approved successfully' };
    } else {
      await user.destroy();
      return { message: 'User registration rejected' };
    }
  }

  async getPendingApprovals() {
    const pendingUsers = await User.findAll({
      where: { isApproved: false },
      attributes: ['id', 'username', 'email', 'name', 'role', 'batchCode', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    return pendingUsers;
  }

  async updateUserStatus(id, isActive) {
    // For now, just return success since we don't have isActive field
    // In a real implementation, you'd add isActive field to User model
    return { message: 'User status updated successfully (simulated)' };
  }
}

module.exports = new UserService();