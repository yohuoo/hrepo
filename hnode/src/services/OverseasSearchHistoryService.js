const { OverseasSearchHistory } = require('../models');
const { Op } = require('sequelize');

class OverseasSearchHistoryService {
  constructor() {}

  /**
   * 添加单条搜索历史记录
   */
  async addSearchHistory(userId, searchParams, companyData) {
    try {
      return await OverseasSearchHistory.create({
        user_id: userId,
        search_query: searchParams.query,
        industry: searchParams.industry,
        country: searchParams.country,
        company_size: searchParams.companySize,
        ...companyData
      });
    } catch (error) {
      // 如果是唯一约束错误，忽略
      if (error.name === 'SequelizeUniqueConstraintError') {
        console.log(`⚠️  公司已存在于历史记录: ${companyData.company_name}`);
        return null;
      }
      throw error;
    }
  }

  /**
   * 批量添加搜索历史记录
   */
  async batchAddSearchHistory(userId, searchParams, companiesList) {
    try {
      const records = companiesList.map(company => ({
        user_id: userId,
        search_query: searchParams.query,
        industry: searchParams.industry,
        country: searchParams.country,
        company_size: searchParams.companySize,
        company_name: company.name,
        company_domain: company.domain,
        company_description: company.description,
        company_location: company.location,
        company_size_result: company.size,
        company_industry: company.industry,
        contact_email: company.email,
        contact_phone: company.phone,
        company_website: company.website,
        ai_summary: company.summary || company.description,
        search_source: 'openai'
      }));
      
      const result = await OverseasSearchHistory.bulkCreate(records, {
        ignoreDuplicates: true,  // 忽略重复记录
        returning: true
      });
      
      console.log(`✅ 成功添加 ${result.length} 条搜索历史记录`);
      return result;
    } catch (error) {
      console.error('❌ 批量添加搜索历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的搜索历史列表
   */
  async getUserSearchHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = null,
        isContacted = null,
        isCustomer = null
      } = options;
      
      const where = { user_id: userId };
      
      // 搜索过滤
      if (search) {
        where[Op.or] = [
          { company_name: { [Op.iLike]: `%${search}%` } },
          { company_domain: { [Op.iLike]: `%${search}%` } },
          { search_query: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      // 状态过滤
      if (isContacted !== null) {
        where.is_contacted = isContacted;
      }
      
      if (isCustomer !== null) {
        where.is_customer = isCustomer;
      }
      
      const { count, rows } = await OverseasSearchHistory.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(pageSize),
        offset: (parseInt(page) - 1) * parseInt(pageSize)
      });
      
      return {
        histories: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      console.error('❌ 获取搜索历史失败:', error);
      throw error;
    }
  }

  /**
   * 获取已搜索过的公司名称和域名列表（用于排除）
   * 限制数量，避免提示词过长
   */
  async getSearchedCompanyNames(userId, limit = 50) {
    try {
      const histories = await OverseasSearchHistory.findAll({
        where: { user_id: userId },
        attributes: ['company_name', 'company_domain'],
        order: [['created_at', 'DESC']],
        limit: limit,  // 只获取最近的N条记录
        raw: true
      });
      
      console.log(`📋 获取最近 ${histories.length} 家已搜索公司用于排除`);
      
      return histories.map(h => ({
        name: h.company_name,
        domain: h.company_domain
      }));
    } catch (error) {
      console.error('❌ 获取已搜索公司列表失败:', error);
      return [];
    }
  }

  /**
   * 获取搜索历史统计
   */
  async getHistoryStats(userId) {
    try {
      const total = await OverseasSearchHistory.count({
        where: { user_id: userId }
      });
      
      const contacted = await OverseasSearchHistory.count({
        where: { user_id: userId, is_contacted: true }
      });
      
      const customers = await OverseasSearchHistory.count({
        where: { user_id: userId, is_customer: true }
      });
      
      return {
        total,
        contacted,
        customers,
        contactRate: total > 0 ? ((contacted / total) * 100).toFixed(2) : 0,
        conversionRate: contacted > 0 ? ((customers / contacted) * 100).toFixed(2) : 0
      };
    } catch (error) {
      console.error('❌ 获取历史统计失败:', error);
      return { total: 0, contacted: 0, customers: 0, contactRate: 0, conversionRate: 0 };
    }
  }

  /**
   * 更新历史记录状态
   */
  async updateHistoryStatus(historyId, userId, updates) {
    try {
      const allowedFields = ['is_contacted', 'is_customer', 'notes'];
      const updateData = {};
      
      // 只允许更新特定字段
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }
      
      const [updatedCount] = await OverseasSearchHistory.update(updateData, {
        where: {
          id: historyId,
          user_id: userId
        }
      });
      
      return updatedCount > 0;
    } catch (error) {
      console.error('❌ 更新历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除历史记录
   */
  async deleteHistory(historyId, userId) {
    try {
      const deletedCount = await OverseasSearchHistory.destroy({
        where: {
          id: historyId,
          user_id: userId
        }
      });
      
      return deletedCount > 0;
    } catch (error) {
      console.error('❌ 删除历史记录失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除历史记录
   */
  async batchDeleteHistory(historyIds, userId) {
    try {
      const deletedCount = await OverseasSearchHistory.destroy({
        where: {
          id: { [Op.in]: historyIds },
          user_id: userId
        }
      });
      
      return deletedCount;
    } catch (error) {
      console.error('❌ 批量删除历史记录失败:', error);
      throw error;
    }
  }
}

module.exports = OverseasSearchHistoryService;

