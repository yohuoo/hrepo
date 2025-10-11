const { User, Department } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

class UserService {
  // 创建用户（带权限检查）
  async createUser(data, creatorRole) {
    const { username, email, password, department_id, role } = data;
    
    // 权限检查
    if (creatorRole === 'admin' && (role === 'super_admin' || role === 'admin')) {
      throw new Error('管理员只能创建普通用户');
    }
    
    // 检查用户名和邮箱是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    
    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }
    
    // 加密密码（默认密码：Admin123456）
    const defaultPassword = password || 'Admin123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // 创建用户
    const user = await User.create({
      username,
      email,
      hashed_password: hashedPassword,
      department_id: department_id || null,
      role: role || 'user',
      is_active: true,
      is_admin: role === 'admin' || role === 'super_admin',
      password_changed: false  // 使用默认密码，需要修改
    });
    
    return user;
  }

  // 获取用户列表
  async getUsers(filters = {}) {
    const { department_id, role, search, page = 1, pageSize = 20 } = filters;
    
    const whereClause = {
      is_active: true
    };
    
    if (department_id) {
      whereClause.department_id = department_id;
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'level']
        }
      ],
      attributes: ['id', 'username', 'email', 'role', 'department_id', 'is_active', 'password_changed', 'last_password_change', 'created_at'],
      offset,
      limit: pageSize,
      order: [['created_at', 'DESC']]
    });
    
    return {
      users: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }

  // 更新用户
  async updateUser(id, data, updaterRole) {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 权限检查：管理员不能修改超级管理员和管理员
    if (updaterRole === 'admin' && (user.role === 'super_admin' || user.role === 'admin')) {
      throw new Error('权限不足');
    }
    
    // 更新字段
    const updateData = {};
    
    if (data.username) updateData.username = data.username;
    if (data.email) updateData.email = data.email;
    if (data.department_id !== undefined) updateData.department_id = data.department_id;
    if (data.role) {
      // 权限检查：管理员不能设置为admin或super_admin
      if (updaterRole === 'admin' && (data.role === 'admin' || data.role === 'super_admin')) {
        throw new Error('管理员只能创建普通用户');
      }
      updateData.role = data.role;
      updateData.is_admin = (data.role === 'admin' || data.role === 'super_admin');
    }
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    
    await user.update(updateData);
    
    return user;
  }

  // 修改密码
  async changePassword(userId, oldPassword, newPassword) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 验证旧密码
    const isValidPassword = await user.validatePassword(oldPassword);
    if (!isValidPassword) {
      throw new Error('原密码错误');
    }
    
    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 更新密码
    await user.update({
      hashed_password: hashedPassword,
      password_changed: true,
      last_password_change: new Date()
    });
    
    return true;
  }

  // 重置密码（管理员操作）
  async resetPassword(userId, resetByAdminId, resetByRole) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 权限检查
    if (resetByRole === 'admin') {
      // 管理员需要验证是否为同部门或子部门
      const resetByAdmin = await User.findByPk(resetByAdminId);
      if (resetByAdmin.department_id !== user.department_id) {
        // TODO: 检查是否为子部门
        throw new Error('只能重置本部门用户的密码');
      }
      
      // 管理员不能重置超级管理员和管理员的密码
      if (user.role === 'super_admin' || user.role === 'admin') {
        throw new Error('权限不足');
      }
    }
    
    // 重置为默认密码
    const defaultPassword = 'Admin123456';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    await user.update({
      hashed_password: hashedPassword,
      password_changed: false,  // 标记为未修改，强制下次登录修改
      last_password_change: new Date()
    });
    
    return true;
  }

  // 检查密码修改状态
  async checkPasswordStatus(userId) {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'password_changed', 'last_password_change']
    });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return {
      password_changed: user.password_changed,
      last_password_change: user.last_password_change,
      requires_change: !user.password_changed
    };
  }
}

module.exports = UserService;

