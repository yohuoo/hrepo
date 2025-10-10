const { Op } = require('sequelize');
const { Customer } = require('../models');

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

      const where = { user_id: userId };

      // 搜索条件
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { company: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // 沟通进度筛选
      if (communicationProgress) {
        where.communication_progress = communicationProgress;
      }

      // 兴趣程度筛选
      if (interestLevel) {
        where.interest_level = interestLevel;
      }

      const { count, rows } = await Customer.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      return {
        customers: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
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
