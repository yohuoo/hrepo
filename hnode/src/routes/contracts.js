const express = require('express');
const router = express.Router();
const { authenticateToken, requirePasswordChange } = require('../middleware/auth');
const ContractService = require('../services/ContractService');
const EmailAIService = require('../services/EmailAIService');

const contractService = new ContractService();
const emailAIService = new EmailAIService();

// 创建合同
router.post('/', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const contract = await contractService.createContract(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      contract,
      message: '合同创建成功'
    });
  } catch (error) {
    console.error('创建合同错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 获取客户的所有合同
router.get('/customer/:customerId', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    const contracts = await contractService.getCustomerContracts(customerId, req.user.id, req.user.role);
    
    res.json({
      success: true,
      contracts
    });
  } catch (error) {
    console.error('获取合同列表错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取合同详情
router.get('/:id', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const contractId = parseInt(req.params.id);
    const contract = await contractService.getContractById(contractId, req.user.id, req.user.role);
    
    res.json({
      success: true,
      contract
    });
  } catch (error) {
    console.error('获取合同详情错误:', error);
    res.status(error.message === '权限不足' ? 403 : 404).json({
      success: false,
      message: error.message
    });
  }
});

// 更新合同
router.put('/:id', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const contractId = parseInt(req.params.id);
    const contract = await contractService.updateContract(contractId, req.user.id, req.user.role, req.body);
    
    res.json({
      success: true,
      contract,
      message: '合同更新成功'
    });
  } catch (error) {
    console.error('更新合同错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// 删除合同
router.delete('/:id', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const contractId = parseInt(req.params.id);
    await contractService.deleteContract(contractId, req.user.id, req.user.role);
    
    res.json({
      success: true,
      message: '合同删除成功'
    });
  } catch (error) {
    console.error('删除合同错误:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// AI生成合同建议
router.post('/ai-suggest/:customerId', authenticateToken, requirePasswordChange, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    
    // 获取上下文数据
    const context = await contractService.suggestContractInfo(customerId, req.user.id);
    
    // 调用AI生成建议
    const suggestion = await emailAIService.suggestContractInfo(context);
    
    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('AI生成合同建议错误:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

