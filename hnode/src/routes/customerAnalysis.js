const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const CustomerAnalysisService = require('../services/CustomerAnalysisService');

const analysisService = new CustomerAnalysisService();

// 获取客户分析（如果有缓存就返回缓存）
router.get('/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    
    // 尝试获取最近的分析记录
    const history = await analysisService.getCustomerAnalysisHistory(
      customerId,
      req.user.id,
      1
    );
    
    if (history.length > 0) {
      const analysis = history[0];
      res.json({
        success: true,
        analysis: {
          id: analysis.id,
          customer_id: analysis.customer_id,
          customer_name: analysis.customer_name,
          customer_first_name: analysis.customer_first_name,
          customer_last_name: analysis.customer_last_name,
          customer_email: analysis.customer_email,
          current_progress: analysis.current_progress,
          opportunities: analysis.opportunities,
          risks: analysis.risks,
          strategic_suggestions: analysis.strategic_suggestions,
          next_actions: analysis.next_actions,
          email_count: analysis.email_count || 0,
          meeting_count: analysis.meeting_count || 0,
          created_at: analysis.created_at
        }
      });
    } else {
      res.json({
        success: false,
        message: '暂无分析数据'
      });
    }
  } catch (error) {
    console.error('获取客户分析错误:', error);
    res.status(500).json({
      success: false,
      message: '获取客户分析失败',
      error: error.message
    });
  }
});

// 分析客户进度（实时生成）- 支持两种路由格式
router.post('/analyze/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);

    const analysis = await analysisService.analyzeCustomer(customerId, req.user.id);

    res.json({
      success: true,
      analysis: {
        id: analysis.id,
        customer_id: analysis.customer_id,
        customer_name: analysis.customer_name,
        customer_first_name: analysis.customer_first_name,
        customer_last_name: analysis.customer_last_name,
        customer_email: analysis.customer_email,
        current_progress: analysis.current_progress,
        opportunities: analysis.opportunities,
        risks: analysis.risks,
        strategic_suggestions: analysis.strategic_suggestions,
        next_actions: analysis.next_actions,
        email_count: analysis.analysis_data?.email_count || 0,
        meeting_count: analysis.analysis_data?.meeting_count || 0,
        created_at: analysis.created_at,
        from_cache: analysis.from_cache || false,
        cache_time: analysis.cache_time || null
      },
      message: analysis.from_cache ? '返回最近一次分析结果（LLM调用失败）' : '客户分析完成'
    });
  } catch (error) {
    console.error('分析客户错误:', error);
    res.status(500).json({
      success: false,
      message: '分析客户失败',
      error: error.message
    });
  }
});

// 分析客户进度（实时生成）- 另一种路由格式
router.post('/:customerId/analyze', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);

    const analysis = await analysisService.analyzeCustomer(customerId, req.user.id);

    res.json({
      success: true,
      analysis: {
        id: analysis.id,
        customer_id: analysis.customer_id,
        customer_name: analysis.customer_name,
        customer_first_name: analysis.customer_first_name,
        customer_last_name: analysis.customer_last_name,
        customer_email: analysis.customer_email,
        current_progress: analysis.current_progress,
        opportunities: analysis.opportunities,
        risks: analysis.risks,
        strategic_suggestions: analysis.strategic_suggestions,
        next_actions: analysis.next_actions,
        email_count: analysis.analysis_data?.email_count || 0,
        meeting_count: analysis.analysis_data?.meeting_count || 0,
        created_at: analysis.created_at,
        from_cache: analysis.from_cache || false,
        cache_time: analysis.cache_time || null
      },
      message: analysis.from_cache ? '返回最近一次分析结果（LLM调用失败）' : '客户分析完成'
    });
  } catch (error) {
    console.error('分析客户错误:', error);
    res.status(500).json({
      success: false,
      message: '分析客户失败',
      error: error.message
    });
  }
});

// 获取客户分析历史记录
router.get('/history/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const limit = parseInt(req.query.limit) || 10;

    const history = await analysisService.getCustomerAnalysisHistory(
      customerId,
      req.user.id,
      limit
    );

    const analyses = history.map(analysis => ({
      id: analysis.id,
      customer_id: analysis.customer_id,
      customer_name: analysis.customer_name,
      customer_first_name: analysis.customer_first_name,
      customer_last_name: analysis.customer_last_name,
      customer_email: analysis.customer_email,
      current_progress: analysis.current_progress,
      opportunities: analysis.opportunities,
      risks: analysis.risks,
      strategic_suggestions: analysis.strategic_suggestions,
      next_actions: analysis.next_actions,
      created_at: analysis.created_at
    }));

    res.json({
      success: true,
      analyses,
      total: analyses.length,
      message: '获取分析历史成功'
    });
  } catch (error) {
    console.error('获取分析历史错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分析历史失败',
      error: error.message
    });
  }
});

module.exports = router;
