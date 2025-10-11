const { Department, User } = require('../models');
const { Op } = require('sequelize');

class DepartmentService {
  // 创建部门
  async createDepartment(data) {
    const department = await Department.create({
      name: data.name,
      parent_id: data.parent_id || null,
      manager_id: data.manager_id || null,
      description: data.description || null,
      is_active: true
    });
    
    // 更新路径和层级
    await department.updatePath();
    
    return department;
  }

  // 更新部门
  async updateDepartment(id, data) {
    const department = await Department.findByPk(id);
    
    if (!department) {
      throw new Error('部门不存在');
    }
    
    const oldParentId = department.parent_id;
    
    // 更新基本信息
    await department.update({
      name: data.name !== undefined ? data.name : department.name,
      parent_id: data.parent_id !== undefined ? data.parent_id : department.parent_id,
      manager_id: data.manager_id !== undefined ? data.manager_id : department.manager_id,
      description: data.description !== undefined ? data.description : department.description,
      is_active: data.is_active !== undefined ? data.is_active : department.is_active
    });
    
    // 如果父部门变更，更新路径
    if (oldParentId !== department.parent_id) {
      await department.updatePath();
      
      // 递归更新所有子部门的路径
      await this.updateChildrenPaths(id);
    }
    
    return department;
  }

  // 递归更新子部门路径
  async updateChildrenPaths(parentId) {
    const children = await Department.findAll({
      where: { parent_id: parentId }
    });
    
    for (const child of children) {
      await child.updatePath();
      await this.updateChildrenPaths(child.id);
    }
  }

  // 删除部门
  async deleteDepartment(id) {
    const department = await Department.findByPk(id);
    
    if (!department) {
      throw new Error('部门不存在');
    }
    
    // 检查是否有子部门
    const childCount = await Department.count({
      where: { parent_id: id }
    });
    
    if (childCount > 0) {
      throw new Error('该部门下有子部门，无法删除');
    }
    
    // 检查是否有成员
    const memberCount = await User.count({
      where: { department_id: id }
    });
    
    if (memberCount > 0) {
      throw new Error('该部门下有成员，无法删除');
    }
    
    await department.destroy();
    return true;
  }

  // 获取部门树
  async getDepartmentTree() {
    const departments = await Department.findAll({
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'username', 'email']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id']
        }
      ],
      order: [['level', 'ASC'], ['id', 'ASC']]
    });
    
    // 构建树形结构
    const tree = this.buildTree(departments);
    return tree;
  }

  // 构建树形结构
  buildTree(departments, parentId = null) {
    const children = departments
      .filter(dept => dept.parent_id === parentId)
      .map(dept => {
        const deptData = dept.toJSON();
        return {
          ...deptData,
          member_count: deptData.members ? deptData.members.length : 0,
          children: this.buildTree(departments, dept.id)
        };
      });
    
    return children;
  }

  // 获取部门详情
  async getDepartmentById(id) {
    const department = await Department.findByPk(id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'username', 'email', 'role']
        },
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'username', 'email', 'role', 'is_active']
        }
      ]
    });
    
    if (!department) {
      throw new Error('部门不存在');
    }
    
    // 获取成员数量
    const memberCount = await User.count({
      where: { department_id: id, is_active: true }
    });
    
    // 获取子部门数量
    const childCount = await Department.count({
      where: { parent_id: id }
    });
    
    return {
      ...department.toJSON(),
      member_count: memberCount,
      child_count: childCount
    };
  }

  // 获取部门成员
  async getDepartmentMembers(id, includeSubDepartments = false) {
    let whereClause = { department_id: id, is_active: true };
    
    if (includeSubDepartments) {
      // 获取所有子部门ID
      const subDeptIds = await this.getSubDepartmentIds(id);
      whereClause = {
        department_id: { [Op.in]: [id, ...subDeptIds] },
        is_active: true
      };
    }
    
    const members = await User.findAll({
      where: whereClause,
      attributes: ['id', 'username', 'email', 'role', 'department_id', 'is_active'],
      include: [
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ],
      order: [['role', 'ASC'], ['username', 'ASC']]
    });
    
    return members;
  }

  // 获取所有子部门ID（递归）
  async getSubDepartmentIds(parentId) {
    const children = await Department.findAll({
      where: { parent_id: parentId },
      attributes: ['id']
    });
    
    let ids = children.map(child => child.id);
    
    for (const child of children) {
      const subIds = await this.getSubDepartmentIds(child.id);
      ids = ids.concat(subIds);
    }
    
    return ids;
  }

  // 获取用户可访问的部门ID列表
  async getAccessibleDepartmentIds(userId, role, departmentId) {
    if (role === 'super_admin') {
      // 超级管理员可以访问所有部门
      const allDepts = await Department.findAll({ attributes: ['id'] });
      return allDepts.map(d => d.id);
    }
    
    if (role === 'admin' && departmentId) {
      // 管理员可以访问自己的部门及所有子部门
      const subDeptIds = await this.getSubDepartmentIds(departmentId);
      return [departmentId, ...subDeptIds];
    }
    
    // 普通用户只能访问自己的部门
    return departmentId ? [departmentId] : [];
  }
}

module.exports = DepartmentService;

