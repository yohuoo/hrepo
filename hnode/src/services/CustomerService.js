const { Op } = require('sequelize');
const { Customer, Contract } = require('../models');
const { sequelize } = require('../config/database');

class CustomerService {
  constructor() {}

  async createCustomer(customerData, userId) {
    try {
      const customer = await Customer.create({
        ...customerData,
        user_id: userId
      });
      return customer;
    } catch (error) {
      throw new Error(`创建客户失败: ${error.message}`);
    }
  }

  async getCustomer(customerId, userId) {
    try {
      const customer = await Customer.findOne({
        where: {
          id: customerId,
          user_id: userId
        }
      });
      return customer;
    } catch (error) {
      throw new Error(`获取客户失败: ${error.message}`);
    }
  }

  async getCustomers(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = null,
        communicationProgress = null,
        interestLevel = null
      } = options;

      // 构建SQL WHERE条件
      let sqlWhere = `user_id = ${userId}`;
      const replacements = [];
      
      if (search) {
        sqlWhere += ` AND (name ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1 OR company ILIKE $1)`;
        replacements.push(`%${search}%`);
      }
      
      if (communicationProgress) {
        sqlWhere += ` AND communication_progress = $${replacements.length + 1}`;
        replacements.push(communicationProgress);
      }
      
      if (interestLevel) {
        sqlWhere += ` AND interest_level = $${replacements.length + 1}`;
        replacements.push(interestLevel);
      }
      
      // 使用原始SQL查询（完全绕过Sequelize模型）
      const offset = (page - 1) * pageSize;
      
      console.log('📊 执行SQL查询，WHERE条件:', sqlWhere);
      
      // 获取总数
      const [countResult] = await sequelize.query(
        `SELECT COUNT(*) as total FROM customers WHERE ${sqlWhere}`,
        { 
          bind: replacements,
          raw: true 
        }
      );
      const total = parseInt(countResult[0].total);
      
      // 获取客户数据（包含deal_status）
      const [customers] = await sequelize.query(
        `SELECT 
          id, user_id, name, first_name, last_name, email, company,
          email_count, communication_progress, interest_level, deal_status,
          last_communication_time, created_at, updated_at
         FROM customers 
         WHERE ${sqlWhere}
         ORDER BY created_at DESC
         LIMIT ${pageSize} OFFSET ${offset}`,
        { 
          bind: replacements,
          raw: true 
        }
      );
      
      console.log('✅ 原始SQL查询完成，共', customers.length, '条记录');
      if (customers.length > 0) {
        console.log('🔍 第一个客户数据:', customers[0]);
      }
      
      // 为每个客户添加合同数量
      const customersWithCount = await Promise.all(customers.map(async (customer) => {
        try {
          const contractCount = await Contract.count({ where: { customer_id: customer.id } });
          customer.contract_count = contractCount;
        } catch (error) {
          customer.contract_count = 0;
        }
        return customer;
      }));

      return {
        customers: customersWithCount,
        total: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      throw new Error(`获取客户列表失败: ${error.message}`);
    }
  }

  async updateCustomer(customerId, customerData, userId) {
    try {
      const [updatedRowsCount] = await Customer.update(customerData, {
        where: {
          id: customerId,
          user_id: userId
        }
      });

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getCustomer(customerId, userId);
    } catch (error) {
      throw new Error(`更新客户失败: ${error.message}`);
    }
  }

  async updateCustomerProgress(customerId, progress, userId) {
    try {
      const validProgresses = ['待联系', '跟进中', '不再跟进', '暂停跟进'];
      if (!validProgresses.includes(progress)) {
        throw new Error('无效的沟通进度');
      }

      const [updatedRowsCount] = await Customer.update(
        { communication_progress: progress },
        {
          where: {
            id: customerId,
            user_id: userId
          }
        }
      );

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getCustomer(customerId, userId);
    } catch (error) {
      throw new Error(`更新客户进度失败: ${error.message}`);
    }
  }

  async updateCustomerInterestLevel(customerId, interestLevel, userId) {
    try {
      const validLevels = ['无兴趣', '低兴趣', '中等兴趣', '高兴趣'];
      if (!validLevels.includes(interestLevel)) {
        throw new Error('无效的兴趣程度');
      }

      const [updatedRowsCount] = await Customer.update(
        { interest_level: interestLevel },
        {
          where: {
            id: customerId,
            user_id: userId
          }
        }
      );

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getCustomer(customerId, userId);
    } catch (error) {
      throw new Error(`更新客户兴趣程度失败: ${error.message}`);
    }
  }

  async deleteCustomer(customerId, userId) {
    try {
      const deletedRowsCount = await Customer.destroy({
        where: {
          id: customerId,
          user_id: userId
        }
      });

      return deletedRowsCount > 0;
    } catch (error) {
      throw new Error(`删除客户失败: ${error.message}`);
    }
  }

  async getCustomerStatistics(userId) {
    try {
      const totalCustomers = await Customer.count({
        where: { user_id: userId }
      });

      // 按沟通进度统计
      const progressStats = await Customer.findAll({
        attributes: [
          'communication_progress',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: { user_id: userId },
        group: ['communication_progress']
      });

      // 按兴趣程度统计
      const interestStats = await Customer.findAll({
        attributes: [
          'interest_level',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        where: { user_id: userId },
        group: ['interest_level']
      });

      // 最近沟通的客户数量
      const recentCommunicationCount = await Customer.count({
        where: {
          user_id: userId,
          last_communication_time: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天
          }
        }
      });

      return {
        total_customers: totalCustomers,
        progress_statistics: progressStats.reduce((acc, item) => {
          acc[item.communication_progress] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        interest_statistics: interestStats.reduce((acc, item) => {
          acc[item.interest_level] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        recent_communication_count: recentCommunicationCount
      };
    } catch (error) {
      throw new Error(`获取客户统计失败: ${error.message}`);
    }
  }
}

module.exports = CustomerService;
