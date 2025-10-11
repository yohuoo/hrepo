const express = require('express');
const router = express.Router();
const { authenticateToken, requirePasswordChange } = require('../middleware/auth');
const CaseStudyService = require('../services/CaseStudyService');

const caseStudyService = new CaseStudyService();

// 生成案例总结（AI）
router.post('/generate/:customerId', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    
    const caseStudy = await caseStudyService.generateCaseStudy(customerId, req.user.id);
    
    res.status(201).json({
      success: true,
      caseStudy,
      message: 'AI案例总结生成成功'
    });
  } catch (error) {
    console.error('生成案例总结错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 获取案例列表
router.get('/', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const { page, page_size } = req.query;
    
    const result = await caseStudyService.getCaseStudies(req.user.id, req.user.role, {
      page: page ? parseInt(page) : 1,
      pageSize: page_size ? parseInt(page_size) : 20
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('获取案例列表错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取案例详情
router.get('/:id', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const caseStudyId = parseInt(req.params.id);
    
    const caseStudy = await caseStudyService.getCaseStudyById(caseStudyId);
    
    res.json({
      success: true,
      caseStudy
    });
  } catch (error) {
    console.error('获取案例详情错误:', error);
    res.status(error.message === '案例不存在' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除案例
router.delete('/:id', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const caseStudyId = parseInt(req.params.id);
    
    await caseStudyService.deleteCaseStudy(caseStudyId, req.user.id, req.user.role);
    
    res.json({
      success: true,
      message: '案例已删除'
    });
  } catch (error) {
    console.error('删除案例错误:', error);
    res.status(error.message === '权限不足' ? 403 : 400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

