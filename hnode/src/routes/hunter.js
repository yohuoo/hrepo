const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const HunterService = require('../services/HunterService');

// 域名联系人搜索
router.get('/domain-search', authenticateToken, async (req, res) => {
  try {
    const { domain, limit = 20 } = req.query;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: '域名参数是必需的'
      });
    }

    const hunterService = new HunterService();
    const result = await hunterService.searchDomainContacts(domain, parseInt(limit));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: '搜索联系人失败',
        error: result.error_message
      });
    }

    res.json({
      success: true,
      contacts: result.contacts,
      total: result.total,
      domain: result.domain,
      message: '搜索完成'
    });
  } catch (error) {
    console.error('Hunter搜索错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: error.message
    });
  }
});

module.exports = router;
