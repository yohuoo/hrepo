const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const OpenAIService = require('../services/OpenAIService');

// 获取海外代糖公司列表
router.get('/companies/sugar-free', authenticateToken, async (req, res) => {
  try {
    const openaiService = new OpenAIService();
    const result = await openaiService.searchCompaniesWithFunctionCall(20);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: '搜索公司失败',
        error: result.error_message
      });
    }

    // 转换数据格式
    const companies = result.companies.map(company => ({
      company_name: company.company_name || 'Unknown Company',
      website: company.website || '',
      description: company.description || 'No description available',
      country: company.country || 'Unknown',
      city: company.city || 'Unknown'
    }));

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

module.exports = router;
