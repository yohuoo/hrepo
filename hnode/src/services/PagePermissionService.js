const { Page, PagePermission, PermissionAuditLog, User, Department } = require('../models');
const { Op } = require('sequelize');
const { redisClient } = require('../config/redis');

class PagePermissionService {
  /**
   * 获取用户的所有权限（包含部门继承）
   */
  async getUserPermissions(userId, departmentId, userRole) {
    console.log('🔍 获取用户权限:', { userId, departmentId, userRole });
    
    // 超级管理员拥有所有权限
    if (userRole === 'super_admin') {
      const allPages = await Page.findAll({
        where: { is_active: true },
        attributes: ['code']
      });
      return allPages.map(p => p.code);
    }
    
    // 检查缓存
    const cacheKey = `user:permissions:${userId}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('✅ 从缓存获取权限');
        return JSON.parse(cached);
      }
    } catch (cacheError) {
      console.warn('⚠️ Redis缓存读取失败，从数据库获取:', cacheError.message);
    }
    
    console.log('📊 从数据库计算权限');
    
    // 获取部门权限
    let deptPermissions = [];
    if (departmentId) {
      const deptPerms = await PagePermission.findAll({
        where: {
          target_type: 'department',
          target_id: departmentId,
          has_permission: true
        },
        include: [{
          model: Page,
          as: 'page',
          where: { is_active: true },
          attributes: ['code']
        }]
      });
      deptPermissions = deptPerms.map(p => p.page.code);
      console.log('  部门权限数量:', deptPermissions.length);
    }
    
    // 获取个人权限
    const userPerms = await PagePermission.findAll({
      where: {
        target_type: 'user',
        target_id: userId
      },
      include: [{
        model: Page,
        as: 'page',
        where: { is_active: true },
        attributes: ['code']
      }]
    });
    
    console.log('  个人权限数量:', userPerms.length);
    
    // 合并权限：从部门权限开始
    const permissionSet = new Set(deptPermissions);
    
    // 应用个人权限（追加或移除）
    userPerms.forEach(p => {
      if (p.has_permission) {
        permissionSet.add(p.page.code);  // 个人额外授予
      } else {
        permissionSet.delete(p.page.code);  // 个人撤销
      }
    });
    
    // 自动包含父页面权限
    const finalPermissions = await this.addParentPermissions(Array.from(permissionSet));
    
    console.log('  最终权限数量:', finalPermissions.length);
    
    // 缓存1小时
    try {
      await redisClient.setex(cacheKey, 3600, JSON.stringify(finalPermissions));
    } catch (cacheError) {
      console.warn('⚠️ Redis缓存写入失败:', cacheError.message);
    }
    
    return finalPermissions;
  }
  
  /**
   * 自动添加父页面权限
   * 如果有子页面权限，自动包含所有父页面
   */
  async addParentPermissions(codes) {
    const codeSet = new Set(codes);
    
    for (const code of codes) {
      // 获取该页面的所有父页面
      const page = await Page.findOne({ where: { code } });
      if (page && page.parent_id) {
        let current = page;
        while (current.parent_id) {
          const parent = await Page.findByPk(current.parent_id);
          if (parent) {
            codeSet.add(parent.code);
            current = parent;
          } else {
            break;
          }
        }
      }
    }
    
    return Array.from(codeSet);
  }
  
  /**
   * 检查用户是否有某个权限
   */
  async hasPermission(userId, departmentId, userRole, pageCode) {
    const permissions = await this.getUserPermissions(userId, departmentId, userRole);
    return permissions.includes(pageCode);
  }
  
  /**
   * 获取页面树结构
   */
  async getPageTree() {
    const allPages = await Page.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['id', 'ASC']]
    });
    
    // 构建树结构
    const buildTree = (parentId = null) => {
      return allPages
        .filter(p => p.parent_id === parentId)
        .map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          page_type: p.page_type,
          url: p.url,
          icon: p.icon,
          is_system: p.is_system,
          children: buildTree(p.id)
        }));
    };
    
    return buildTree();
  }
  
  /**
   * 获取目标（部门或用户）的权限配置
   */
  async getTargetPermissions(targetType, targetId) {
    const permissions = await PagePermission.findAll({
      where: {
        target_type: targetType,
        target_id: targetId
      },
      include: [{
        model: Page,
        as: 'page',
        attributes: ['id', 'code', 'name']
      }]
    });
    
    // 返回有权限的页面code数组
    return permissions
      .filter(p => p.has_permission)
      .map(p => p.page.code);
  }
  
  /**
   * 更新目标（部门或用户）的权限
   */
  async updateTargetPermissions(targetType, targetId, permissionCodes, operatorId, operatorName, ipAddress = null, userAgent = null) {
    console.log('📝 更新权限:', { targetType, targetId, permissionCount: permissionCodes.length });
    
    // 获取目标名称
    let targetName = '';
    if (targetType === 'department') {
      const dept = await Department.findByPk(targetId);
      targetName = dept ? dept.name : `部门${targetId}`;
    } else {
      const user = await User.findByPk(targetId);
      targetName = user ? user.username : `用户${targetId}`;
    }
    
    // 获取所有页面
    const allPages = await Page.findAll({
      where: { is_active: true },
      attributes: ['id', 'code', 'name']
    });
    
    // 计算变更
    const oldPermissions = await this.getTargetPermissions(targetType, targetId);
    const added = permissionCodes.filter(code => !oldPermissions.includes(code));
    const removed = oldPermissions.filter(code => !permissionCodes.includes(code));
    
    console.log('  新增权限:', added.length);
    console.log('  移除权限:', removed.length);
    
    // 删除所有旧权限
    await PagePermission.destroy({
      where: {
        target_type: targetType,
        target_id: targetId
      }
    });
    
    // 批量插入新权限
    const permissionsToInsert = [];
    for (const page of allPages) {
      permissionsToInsert.push({
        page_id: page.id,
        target_type: targetType,
        target_id: targetId,
        has_permission: permissionCodes.includes(page.code),
        created_by: operatorId
      });
    }
    
    await PagePermission.bulkCreate(permissionsToInsert, {
      updateOnDuplicate: ['has_permission', 'updated_at']
    });
    
    // 记录审计日志
    if (added.length > 0 || removed.length > 0) {
      await PermissionAuditLog.create({
        operator_id: operatorId,
        operator_name: operatorName,
        action_type: 'update',
        target_type: targetType,
        target_id: targetId,
        target_name: targetName,
        changes: {
          added: added.map(code => {
            const page = allPages.find(p => p.code === code);
            return { code, name: page?.name || code };
          }),
          removed: removed.map(code => {
            const page = allPages.find(p => p.code === code);
            return { code, name: page?.name || code };
          })
        },
        ip_address: ipAddress,
        user_agent: userAgent
      });
    }
    
    // 清除缓存
    await this.clearPermissionCache(targetType, targetId);
    
    console.log('✅ 权限更新完成');
    
    return {
      added,
      removed,
      total: permissionCodes.length
    };
  }
  
  /**
   * 清除权限缓存
   */
  async clearPermissionCache(targetType, targetId) {
    try {
      if (targetType === 'department') {
        // 清除部门缓存
        await redisClient.del(`department:permissions:${targetId}`);
        
        // 清除该部门所有用户的缓存
        const users = await User.findAll({
          where: { department_id: targetId },
          attributes: ['id']
        });
        
        for (const user of users) {
          await redisClient.del(`user:permissions:${user.id}`);
        }
        
        console.log(`🗑️ 已清除部门${targetId}及其${users.length}个用户的缓存`);
      } else if (targetType === 'user') {
        // 清除用户缓存
        await redisClient.del(`user:permissions:${targetId}`);
        console.log(`🗑️ 已清除用户${targetId}的缓存`);
      }
    } catch (cacheError) {
      console.warn('⚠️ 清除缓存失败:', cacheError.message);
      // 不影响主流程
    }
  }
  
  /**
   * 获取权限审计日志
   */
  async getAuditLogs(options = {}) {
    const { page = 1, pageSize = 50, targetType, targetId } = options;
    
    const whereClause = {};
    if (targetType) whereClause.target_type = targetType;
    if (targetId) whereClause.target_id = targetId;
    
    const { count, rows } = await PermissionAuditLog.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'operator',
        attributes: ['id', 'username', 'email']
      }],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['created_at', 'DESC']]
    });
    
    return {
      logs: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }
  
  /**
   * 初始化新部门的默认权限（所有权限）
   */
  async initializeDepartmentPermissions(departmentId, operatorId) {
    console.log('🎁 初始化部门权限:', departmentId);
    
    const allPages = await Page.findAll({
      where: { is_active: true },
      attributes: ['id', 'code']
    });
    
    const permissions = allPages.map(page => ({
      page_id: page.id,
      target_type: 'department',
      target_id: departmentId,
      has_permission: true,
      created_by: operatorId
    }));
    
    await PagePermission.bulkCreate(permissions, {
      ignoreDuplicates: true
    });
    
    console.log(`✅ 已为部门${departmentId}初始化${permissions.length}个权限`);
  }
  
  /**
   * 初始化新用户的默认权限（继承部门权限 + 全部权限）
   */
  async initializeUserPermissions(userId, departmentId, operatorId) {
    console.log('🎁 初始化用户权限:', userId);
    
    const allPages = await Page.findAll({
      where: { is_active: true },
      attributes: ['id', 'code']
    });
    
    const permissions = allPages.map(page => ({
      page_id: page.id,
      target_type: 'user',
      target_id: userId,
      has_permission: true,
      created_by: operatorId
    }));
    
    await PagePermission.bulkCreate(permissions, {
      ignoreDuplicates: true
    });
    
    console.log(`✅ 已为用户${userId}初始化${permissions.length}个权限`);
  }
}

module.exports = PagePermissionService;

