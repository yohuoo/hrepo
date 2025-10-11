const { SalesRecord, Customer, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

class SalesService {
  // 创建销售记录
  async createSalesRecord(userId, data) {
    const { customer_id, sale_date, product_name, quantity, amount, currency, notes } = data;
    
    // 验证客户是否存在
    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
      throw new Error('客户不存在');
    }
    
    const salesRecord = await SalesRecord.create({
      user_id: userId,
      customer_id,
      sale_date,
      product_name,
      quantity,
      amount,
      currency: currency || 'USD',
      notes
    });
    
    return salesRecord;
  }

  // 获取销售记录列表
  async getSalesRecords(userId, userRole, filters = {}) {
    const { customer_id, start_date, end_date, product_name, page = 1, pageSize = 20, user_id, department_id } = filters;
    
    const whereClause = {};
    
    // 权限和筛选过滤
    if (userRole === 'user') {
      // 普通用户只能看自己的
      whereClause.user_id = userId;
    } else {
      // 管理员或超级管理员
      if (user_id) {
        // 按用户筛选
        whereClause.user_id = parseInt(user_id);
        console.log('📊 销售记录 - 筛选用户ID:', user_id);
      } else if (department_id) {
        // 按部门筛选：获取该部门所有用户
        const DepartmentService = require('./DepartmentService');
        const deptService = new DepartmentService();
        const subDeptIds = await deptService.getSubDepartmentIds(parseInt(department_id));
        const deptIds = [parseInt(department_id), ...subDeptIds];
        
        console.log('📊 销售记录 - 筛选部门IDs:', deptIds);
        
        const deptUsers = await User.findAll({
          where: { department_id: { [Op.in]: deptIds } },
          attributes: ['id']
        });
        
        const userIds = deptUsers.map(u => u.id);
        console.log('📊 销售记录 - 部门内用户IDs:', userIds);
        
        if (userIds.length > 0) {
          whereClause.user_id = { [Op.in]: userIds };
        } else {
          // 部门下没有用户，返回空结果
          whereClause.user_id = 0;
        }
      }
      // 如果都不选，则显示所有数据（管理员权限）
    }
    
    if (customer_id) {
      whereClause.customer_id = customer_id;
    }
    
    if (start_date && end_date) {
      whereClause.sale_date = {
        [Op.between]: [start_date, end_date]
      };
    } else if (start_date) {
      whereClause.sale_date = {
        [Op.gte]: start_date
      };
    } else if (end_date) {
      whereClause.sale_date = {
        [Op.lte]: end_date
      };
    }
    
    if (product_name) {
      whereClause.product_name = {
        [Op.iLike]: `%${product_name}%`
      };
    }
    
    const offset = (page - 1) * pageSize;
    
    const { count, rows } = await SalesRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'company', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      offset,
      limit: pageSize,
      order: [['sale_date', 'DESC'], ['created_at', 'DESC']]
    });
    
    return {
      sales_records: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  }

  // 更新销售记录
  async updateSalesRecord(id, userId, userRole, data) {
    const salesRecord = await SalesRecord.findByPk(id);
    
    if (!salesRecord) {
      throw new Error('销售记录不存在');
    }
    
    // 权限检查：普通用户只能修改自己的记录
    if (userRole === 'user' && salesRecord.user_id !== userId) {
      throw new Error('权限不足');
    }
    
    await salesRecord.update(data);
    
    return salesRecord;
  }

  // 删除销售记录
  async deleteSalesRecord(id, userId, userRole) {
    const salesRecord = await SalesRecord.findByPk(id);
    
    if (!salesRecord) {
      throw new Error('销售记录不存在');
    }
    
    // 权限检查
    if (userRole === 'user' && salesRecord.user_id !== userId) {
      throw new Error('权限不足');
    }
    
    await salesRecord.destroy();
    
    return true;
  }

  // 销售数据统计
  async getSalesStatistics(userId, userRole, userDepartmentId, filters = {}) {
    const { start_date, end_date, user_id, department_id } = filters;
    
    console.log('📊 销售统计 - 参数:', { userId, userRole, userDepartmentId, user_id, department_id, start_date, end_date });
    
    const whereClause = {};
    
    // 权限和筛选过滤
    if (userRole === 'user') {
      // 普通用户只能看自己的
      whereClause.user_id = userId;
    } else {
      // 管理员或超级管理员
      if (user_id) {
        // 按用户筛选
        whereClause.user_id = parseInt(user_id);
        console.log('📊 销售统计 - 筛选用户ID:', user_id);
      } else if (department_id) {
        // 按部门筛选：获取该部门所有用户
        const DepartmentService = require('./DepartmentService');
        const deptService = new DepartmentService();
        const subDeptIds = await deptService.getSubDepartmentIds(parseInt(department_id));
        const deptIds = [parseInt(department_id), ...subDeptIds];
        
        console.log('📊 销售统计 - 筛选部门IDs:', deptIds);
        
        const deptUsers = await User.findAll({
          where: { department_id: { [Op.in]: deptIds } },
          attributes: ['id']
        });
        
        const userIds = deptUsers.map(u => u.id);
        console.log('📊 销售统计 - 部门内用户IDs:', userIds);
        
        if (userIds.length > 0) {
          whereClause.user_id = { [Op.in]: userIds };
        } else {
          // 部门下没有用户，返回空结果
          whereClause.user_id = 0;
        }
      }
      // 如果都不选，则显示所有数据（管理员权限）
    }
    
    // 时间范围
    if (start_date && end_date) {
      whereClause.sale_date = {
        [Op.between]: [start_date, end_date]
      };
      console.log('📅 时间范围:', start_date, '至', end_date);
    } else if (start_date) {
      whereClause.sale_date = {
        [Op.gte]: start_date
      };
      console.log('📅 开始时间:', start_date);
    } else if (end_date) {
      whereClause.sale_date = {
        [Op.lte]: end_date
      };
      console.log('📅 结束时间:', end_date);
    } else {
      console.log('📅 无时间筛选（查询全部）');
    }
    
    console.log('📊 销售统计 - 查询条件:', whereClause);
    
    // 统计查询
    const stats = await SalesRecord.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_records'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('customer_id'))), 'customer_count']
      ],
      raw: true
    });
    
    // 按产品统计
    const productStats = await SalesRecord.findAll({
      where: whereClause,
      attributes: [
        'product_name',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity']
      ],
      group: ['product_name'],
      raw: true
    });
    
    // 按日期统计（最近30天）
    const dateStats = await SalesRecord.findAll({
      where: {
        ...whereClause,
        sale_date: {
          [Op.gte]: sequelize.literal("CURRENT_DATE - INTERVAL '30 days'")
        }
      },
      attributes: [
        'sale_date',
        [sequelize.fn('SUM', sequelize.col('amount')), 'daily_amount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'daily_count']
      ],
      group: ['sale_date'],
      order: [['sale_date', 'ASC']],
      raw: true
    });
    
    return {
      summary: stats[0] || {
        total_records: 0,
        total_amount: 0,
        total_quantity: 0,
        customer_count: 0
      },
      by_product: productStats,
      by_date: dateStats
    };
  }
}

module.exports = SalesService;

