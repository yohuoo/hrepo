const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const SalesService = require('../services/SalesService');

const salesService = new SalesService();

// 获取销售记录列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await salesService.getSalesRecords(
      req.user.id,
      req.user.role,
      req.query
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取销售记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取销售记录失败',
      error: error.message
    });
  }
});

// 创建销售记录
router.post('/', authenticateToken, async (req, res) => {
  try {
    const salesRecord = await salesService.createSalesRecord(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      sales_record: salesRecord,
      message: '销售记录创建成功'
    });
  } catch (error) {
    console.error('创建销售记录错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 更新销售记录
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const salesRecord = await salesService.updateSalesRecord(
      parseInt(req.params.id),
      req.user.id,
      req.user.role,
      req.body
    );
    
    res.json({
      success: true,
      sales_record: salesRecord,
      message: '销售记录更新成功'
    });
  } catch (error) {
    console.error('更新销售记录错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 删除销售记录
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await salesService.deleteSalesRecord(
      parseInt(req.params.id),
      req.user.id,
      req.user.role
    );
    
    res.json({
      success: true,
      message: '销售记录删除成功'
    });
  } catch (error) {
    console.error('删除销售记录错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 销售数据统计
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const stats = await salesService.getSalesStatistics(
      req.user.id,
      req.user.role,
      req.user.department_id,
      req.query
    );
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('获取销售统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取销售统计失败',
      error: error.message
    });
  }
});

module.exports = router;

