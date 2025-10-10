const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const CustomerService = require('../services/CustomerService');

const customerService = new CustomerService();

// 获取客户列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = null,
      communicationProgress = null,
      interestLevel = null
    } = req.query;

    const result = await customerService.getCustomers(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      communicationProgress,
      interestLevel
    });

    const customers = result.customers.map(customer => ({
      id: customer.id,
      user_id: customer.user_id,
      name: customer.name,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      company: customer.company,
      email_count: customer.email_count,
      communication_progress: customer.communication_progress,
      interest_level: customer.interest_level,
      last_communication_time: customer.last_communication_time,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    }));

    res.json({
      success: true,
      customers,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      total_pages: result.totalPages
    });
  } catch (error) {
    console.error('获取客户列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      error: error.message
    });
  }
});

// 创建客户
router.post('/', authenticateToken, async (req, res) => {
  try {
    const customer = await customerService.createCustomer(req.body, req.user.id);

    res.status(201).json({
      success: true,
      customer: {
        id: customer.id,
        user_id: customer.user_id,
        name: customer.name,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        company: customer.company,
        email_count: customer.email_count,
        communication_progress: customer.communication_progress,
        interest_level: customer.interest_level,
        last_communication_time: customer.last_communication_time,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      },
      message: '客户创建成功'
    });
  } catch (error) {
    console.error('创建客户错误:', error);
    res.status(500).json({
      success: false,
      message: '创建客户失败',
      error: error.message
    });
  }
});

// 获取单个客户
router.get('/:customerId', authenticateToken, async (req, res) => {
  try {
    const customer = await customerService.getCustomer(
      parseInt(req.params.customerId), 
      req.user.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        user_id: customer.user_id,
        name: customer.name,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        company: customer.company,
        email_count: customer.email_count,
        communication_progress: customer.communication_progress,
        interest_level: customer.interest_level,
        last_communication_time: customer.last_communication_time,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      }
    });
  } catch (error) {
    console.error('获取客户错误:', error);
    res.status(500).json({
      success: false,
      message: '获取客户失败',
      error: error.message
    });
  }
});

// 更新客户
router.put('/:customerId', authenticateToken, async (req, res) => {
  try {
    const customer = await customerService.updateCustomer(
      parseInt(req.params.customerId), 
      req.body, 
      req.user.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        user_id: customer.user_id,
        name: customer.name,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        company: customer.company,
        email_count: customer.email_count,
        communication_progress: customer.communication_progress,
        interest_level: customer.interest_level,
        last_communication_time: customer.last_communication_time,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      },
      message: '客户更新成功'
    });
  } catch (error) {
    console.error('更新客户错误:', error);
    res.status(500).json({
      success: false,
      message: '更新客户失败',
      error: error.message
    });
  }
});

// 删除客户
router.delete('/:customerId', authenticateToken, async (req, res) => {
  try {
    const success = await customerService.deleteCustomer(
      parseInt(req.params.customerId), 
      req.user.id
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    res.json({
      success: true,
      message: '客户删除成功'
    });
  } catch (error) {
    console.error('删除客户错误:', error);
    res.status(500).json({
      success: false,
      message: '删除客户失败',
      error: error.message
    });
  }
});

// 更新客户沟通进度
router.patch('/:customerId/progress', authenticateToken, async (req, res) => {
  try {
    const { progress } = req.body;

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: '沟通进度是必需的'
      });
    }

    const customer = await customerService.updateCustomerProgress(
      parseInt(req.params.customerId), 
      progress, 
      req.user.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        communication_progress: customer.communication_progress
      },
      message: '沟通进度更新成功'
    });
  } catch (error) {
    console.error('更新沟通进度错误:', error);
    res.status(500).json({
      success: false,
      message: '更新沟通进度失败',
      error: error.message
    });
  }
});

// 更新客户兴趣程度
router.patch('/:customerId/interest-level', authenticateToken, async (req, res) => {
  try {
    const { interest_level } = req.body;

    if (!interest_level) {
      return res.status(400).json({
        success: false,
        message: '兴趣程度是必需的'
      });
    }

    const customer = await customerService.updateCustomerInterestLevel(
      parseInt(req.params.customerId), 
      interest_level, 
      req.user.id
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在'
      });
    }

    res.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        interest_level: customer.interest_level
      },
      message: '兴趣程度更新成功'
    });
  } catch (error) {
    console.error('更新兴趣程度错误:', error);
    res.status(500).json({
      success: false,
      message: '更新兴趣程度失败',
      error: error.message
    });
  }
});

// 获取客户统计信息
router.get('/statistics/overview', authenticateToken, async (req, res) => {
  try {
    const statistics = await customerService.getCustomerStatistics(req.user.id);

    res.json({
      success: true,
      statistics,
      message: '获取客户统计成功'
    });
  } catch (error) {
    console.error('获取客户统计错误:', error);
    res.status(500).json({
      success: false,
      message: '获取客户统计失败',
      error: error.message
    });
  }
});

module.exports = router;
