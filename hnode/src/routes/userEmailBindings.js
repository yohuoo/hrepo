const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const UserEmailBindingService = require('../services/UserEmailBindingService');

const emailBindingService = new UserEmailBindingService();

// 获取用户的所有邮箱绑定
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await emailBindingService.getUserEmailBindings(req.user.id, { pageSize: 100 });
    
    res.json({
      success: true,
      bindings: result.bindings.map(binding => ({
        id: binding.id,
        user_id: binding.user_id,
        email_address: binding.email_address,
        smtp_host: binding.smtp_host,
        smtp_port: binding.smtp_port,
        smtp_secure: binding.smtp_secure,
        smtp_auth: binding.smtp_auth,
        is_default: binding.is_default,
        status: binding.status || 'active',
        created_at: binding.created_at,
        updated_at: binding.updated_at
      })),
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      total_pages: result.totalPages
    });
  } catch (error) {
    console.error('获取邮箱绑定列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邮箱绑定列表失败',
      error: error.message
    });
  }
});

// 创建/添加邮箱绑定（标准接口）
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      email_address, 
      password,
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_auth,
      is_default
    } = req.body;

    if (!email_address || !password) {
      return res.status(400).json({
        success: false,
        message: '邮箱地址和密码都是必需的'
      });
    }

    const binding = await emailBindingService.bindEmail(
      { 
        email_address, 
        email_password: password,
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_auth
      }, 
      req.user.id
    );
    
    // 如果设置为默认邮箱
    if (is_default) {
      await emailBindingService.setDefaultEmailBinding(binding.id, req.user.id);
    }

    res.status(201).json({
      success: true,
      binding: {
        id: binding.id,
        user_id: binding.user_id,
        email_address: binding.email_address,
        smtp_host: binding.smtp_host,
        smtp_port: binding.smtp_port,
        smtp_secure: binding.smtp_secure,
        smtp_auth: binding.smtp_auth,
        is_default: is_default || false,
        created_at: binding.created_at
      },
      message: '邮箱绑定成功'
    });
  } catch (error) {
    console.error('邮箱绑定错误:', error);
    res.status(500).json({
      success: false,
      message: '邮箱绑定失败',
      error: error.message
    });
  }
});

// 绑定邮箱（保留旧接口兼容性）
router.post('/bind', authenticateToken, async (req, res) => {
  try {
    const { email_address, email_password } = req.body;

    if (!email_address || !email_password) {
      return res.status(400).json({
        success: false,
        message: '邮箱地址和密码都是必需的'
      });
    }

    const binding = await emailBindingService.bindEmail(
      { email_address, email_password }, 
      req.user.id
    );

    res.status(201).json({
      success: true,
      email_binding: {
        id: binding.id,
        user_id: binding.user_id,
        email_address: binding.email_address,
        status: binding.status,
        created_at: binding.created_at,
        updated_at: binding.updated_at
      },
      message: '邮箱绑定成功'
    });
  } catch (error) {
    console.error('绑定邮箱错误:', error);
    res.status(500).json({
      success: false,
      message: '绑定邮箱失败',
      error: error.message
    });
  }
});

// 获取邮箱绑定列表
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 5 } = req.query;

    const result = await emailBindingService.getUserEmailBindings(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    const bindings = result.bindings.map(binding => ({
      id: binding.id,
      user_id: binding.user_id,
      email_address: binding.email_address,
      status: binding.status,
      created_at: binding.created_at,
      updated_at: binding.updated_at
    }));

    res.json({
      success: true,
      email_bindings: bindings,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      total_pages: result.totalPages
    });
  } catch (error) {
    console.error('获取邮箱绑定列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邮箱绑定列表失败',
      error: error.message
    });
  }
});

// 获取单个邮箱绑定
router.get('/:bindingId', authenticateToken, async (req, res) => {
  try {
    const binding = await emailBindingService.getEmailBinding(
      parseInt(req.params.bindingId), 
      req.user.id
    );

    if (!binding) {
      return res.status(404).json({
        success: false,
        message: '邮箱绑定不存在'
      });
    }

    res.json({
      success: true,
      email_binding: {
        id: binding.id,
        user_id: binding.user_id,
        email_address: binding.email_address,
        status: binding.status,
        created_at: binding.created_at,
        updated_at: binding.updated_at
      }
    });
  } catch (error) {
    console.error('获取邮箱绑定错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邮箱绑定失败',
      error: error.message
    });
  }
});

// 更新邮箱配置
router.put('/:bindingId', authenticateToken, async (req, res) => {
  try {
    const bindingId = parseInt(req.params.bindingId);
    const { is_default, ...updateData } = req.body;
    
    // 更新邮箱配置
    const binding = await emailBindingService.updateEmailBinding(
      bindingId, 
      updateData, 
      req.user.id
    );

    if (!binding) {
      return res.status(404).json({
        success: false,
        message: '邮箱绑定不存在'
      });
    }
    
    // 如果设置为默认邮箱
    if (is_default === true) {
      await emailBindingService.setDefaultEmailBinding(bindingId, req.user.id);
    }

    res.json({
      success: true,
      email_binding: {
        id: binding.id,
        user_id: binding.user_id,
        email_address: binding.email_address,
        smtp_host: binding.smtp_host,
        smtp_port: binding.smtp_port,
        is_default: is_default || binding.is_default,
        status: binding.status,
        created_at: binding.created_at,
        updated_at: binding.updated_at
      },
      message: '邮箱配置更新成功'
    });
  } catch (error) {
    console.error('更新邮箱配置错误:', error);
    res.status(500).json({
      success: false,
      message: '更新邮箱配置失败',
      error: error.message
    });
  }
});

// 删除邮箱绑定
router.delete('/:bindingId', authenticateToken, async (req, res) => {
  try {
    const success = await emailBindingService.deleteEmailBinding(
      parseInt(req.params.bindingId), 
      req.user.id
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '邮箱绑定不存在'
      });
    }

    res.json({
      success: true,
      message: '邮箱绑定删除成功'
    });
  } catch (error) {
    console.error('删除邮箱绑定错误:', error);
    res.status(500).json({
      success: false,
      message: '删除邮箱绑定失败',
      error: error.message
    });
  }
});

// 设置默认邮箱
router.patch('/:bindingId/set-default', authenticateToken, async (req, res) => {
  try {
    const binding = await emailBindingService.setDefaultEmailBinding(
      parseInt(req.params.bindingId),
      req.user.id
    );

    if (!binding) {
      return res.status(404).json({
        success: false,
        message: '邮箱绑定不存在'
      });
    }

    res.json({
      success: true,
      email_binding: {
        id: binding.id,
        email_address: binding.email_address,
        is_default: binding.is_default,
        status: binding.status
      },
      message: '默认邮箱设置成功'
    });
  } catch (error) {
    console.error('设置默认邮箱错误:', error);
    res.status(500).json({
      success: false,
      message: '设置默认邮箱失败',
      error: error.message
    });
  }
});

// 启动/暂停邮箱绑定
router.patch('/:bindingId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '状态参数是必需的，只支持 active 或 inactive'
      });
    }

    const binding = await emailBindingService.toggleEmailBindingStatus(
      parseInt(req.params.bindingId), 
      status, 
      req.user.id
    );

    if (!binding) {
      return res.status(404).json({
        success: false,
        message: '邮箱绑定不存在'
      });
    }

    res.json({
      success: true,
      email_binding: {
        id: binding.id,
        email_address: binding.email_address,
        status: binding.status
      },
      message: `邮箱绑定已${status === 'active' ? '启动' : '暂停'}`
    });
  } catch (error) {
    console.error('更新邮箱绑定状态错误:', error);
    res.status(500).json({
      success: false,
      message: '更新邮箱绑定状态失败',
      error: error.message
    });
  }
});

module.exports = router;
