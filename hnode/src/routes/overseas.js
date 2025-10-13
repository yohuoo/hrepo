const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const OpenAIService = require('../services/OpenAIService');
const OverseasSearchHistoryService = require('../services/OverseasSearchHistoryService');

// 获取海外代糖公司列表（带历史记录功能）
router.get('/companies/sugar-free', authenticateToken, async (req, res) => {
  try {
    const openaiService = new OpenAIService();
    const historyService = new OverseasSearchHistoryService();
    
    // 获取已搜索过的公司列表用于排除
    const excludeCompanies = await historyService.getSearchedCompanyNames(req.user.id);
    console.log(`📋 用户已搜索过 ${excludeCompanies.length} 家公司`);
    
    // 调用OpenAI搜索，传入排除列表
    const result = await openaiService.searchCompaniesWithFunctionCall(20, excludeCompanies);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: '搜索公司失败',
        error: result.error_message
      });
    }

    // 转换数据格式并确保数据完整性
    const companies = result.companies.map(company => {
      // 提取域名
      let domain = '';
      if (company.website) {
        try {
          const url = new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`);
          domain = url.hostname.replace(/^www\./, '');
        } catch (e) {
          domain = company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        }
      }
      
      return {
        name: company.company_name,  // 不使用默认值，保持数据准确性
        domain: domain,
        website: company.website || '',
        description: company.description || '',
        country: company.country || '',
        city: company.city || '',  // 单独保留city字段
        location: company.city && company.country ? `${company.city}, ${company.country}` : (company.country || ''),
        industry: '食品/饮料/健康食品',
        size: '',
        email: '',
        phone: ''
      };
    }).filter(company => company.name);  // 过滤掉没有公司名称的记录
    
    // 批量保存搜索历史
    try {
      await historyService.batchAddSearchHistory(req.user.id, {
        query: 'sugar-free companies',
        industry: '食品/饮料',
        country: '全球',
        companySize: ''
      }, companies);
      console.log('✅ 搜索历史已保存');
    } catch (historyError) {
      console.error('⚠️  保存搜索历史失败:', historyError.message);
      // 不影响主流程，继续返回结果
    }

    res.json({
      success: true,
      companies: companies,
      total: companies.length,
      message: '搜索完成'
    });
  } catch (error) {
    console.error('海外公司搜索错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

// 获取搜索历史列表
router.get('/search-history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, search, isContacted, isCustomer } = req.query;
    const historyService = new OverseasSearchHistoryService();
    
    const result = await historyService.getUserSearchHistory(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      isContacted: isContacted !== undefined ? isContacted === 'true' : null,
      isCustomer: isCustomer !== undefined ? isCustomer === 'true' : null
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    res.status(500).json({
      success: false,
      message: '获取搜索历史失败',
      error: error.message
    });
  }
});

// 获取搜索历史统计
router.get('/search-history/stats', authenticateToken, async (req, res) => {
  try {
    const historyService = new OverseasSearchHistoryService();
    const stats = await historyService.getHistoryStats(req.user.id);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取历史统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取历史统计失败',
      error: error.message
    });
  }
});

// 更新历史记录状态
router.patch('/search-history/:id', authenticateToken, async (req, res) => {
  try {
    const { is_contacted, is_customer, notes } = req.body;
    const historyService = new OverseasSearchHistoryService();
    
    const updated = await historyService.updateHistoryStatus(
      parseInt(req.params.id),
      req.user.id,
      { is_contacted, is_customer, notes }
    );
    
    if (updated) {
      res.json({
        success: true,
        message: '更新成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '记录不存在或无权限'
      });
    }
  } catch (error) {
    console.error('更新历史记录失败:', error);
    res.status(500).json({
      success: false,
      message: '更新失败',
      error: error.message
    });
  }
});

// 删除历史记录
router.delete('/search-history/:id', authenticateToken, async (req, res) => {
  try {
    const historyService = new OverseasSearchHistoryService();
    const deleted = await historyService.deleteHistory(
      parseInt(req.params.id),
      req.user.id
    );
    
    if (deleted) {
      res.json({
        success: true,
        message: '删除成功'
      });
    } else {
      res.status(404).json({
        success: false,
        message: '记录不存在或无权限'
      });
    }
  } catch (error) {
    console.error('删除历史记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除失败',
      error: error.message
    });
  }
});

// 批量删除历史记录
router.post('/search-history/batch-delete', authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的记录ID列表'
      });
    }
    
    const historyService = new OverseasSearchHistoryService();
    const deletedCount = await historyService.batchDeleteHistory(ids, req.user.id);
    
    res.json({
      success: true,
      message: `成功删除 ${deletedCount} 条记录`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('批量删除历史记录失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除失败',
      error: error.message
    });
  }
});

module.exports = router;
