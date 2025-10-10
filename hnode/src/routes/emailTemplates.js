const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EmailTemplateService = require('../services/EmailTemplateService');

const emailTemplateService = new EmailTemplateService();

// 获取邮件模板列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const result = await emailTemplateService.getTemplates(req.user.id, {
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    const templates = result.templates.map(template => ({
      id: template.id,
      user_id: template.user_id,
      title: template.title,
      content: template.content,
      variables: template.getVariables(),
      created_at: template.created_at,
      updated_at: template.updated_at
    }));

    res.json({
      success: true,
      templates,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      total_pages: result.totalPages
    });
  } catch (error) {
    console.error('获取邮件模板列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邮件模板列表失败',
      error: error.message
    });
  }
});

// 创建邮件模板
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容都是必需的'
      });
    }

    const template = await emailTemplateService.createTemplate(
      { title, content }, 
      req.user.id
    );

    res.status(201).json({
      success: true,
      template: {
        id: template.id,
        user_id: template.user_id,
        title: template.title,
        content: template.content,
        variables: template.getVariables(),
        created_at: template.created_at,
        updated_at: template.updated_at
      },
      message: '邮件模板创建成功'
    });
  } catch (error) {
    console.error('创建邮件模板错误:', error);
    res.status(500).json({
      success: false,
      message: '创建邮件模板失败',
      error: error.message
    });
  }
});

// 获取单个邮件模板
router.get('/:templateId', authenticateToken, async (req, res) => {
  try {
    const template = await emailTemplateService.getTemplate(
      parseInt(req.params.templateId), 
      req.user.id
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '邮件模板不存在'
      });
    }

    res.json({
      success: true,
      template: {
        id: template.id,
        user_id: template.user_id,
        title: template.title,
        content: template.content,
        variables: template.getVariables(),
        created_at: template.created_at,
        updated_at: template.updated_at
      }
    });
  } catch (error) {
    console.error('获取邮件模板错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邮件模板失败',
      error: error.message
    });
  }
});

// 更新邮件模板
router.put('/:templateId', authenticateToken, async (req, res) => {
  try {
    const template = await emailTemplateService.updateTemplate(
      parseInt(req.params.templateId), 
      req.body, 
      req.user.id
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '邮件模板不存在'
      });
    }

    res.json({
      success: true,
      template: {
        id: template.id,
        user_id: template.user_id,
        title: template.title,
        content: template.content,
        variables: template.getVariables(),
        created_at: template.created_at,
        updated_at: template.updated_at
      },
      message: '邮件模板更新成功'
    });
  } catch (error) {
    console.error('更新邮件模板错误:', error);
    res.status(500).json({
      success: false,
      message: '更新邮件模板失败',
      error: error.message
    });
  }
});

// 删除邮件模板
router.delete('/:templateId', authenticateToken, async (req, res) => {
  try {
    const success = await emailTemplateService.deleteTemplate(
      parseInt(req.params.templateId), 
      req.user.id
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '邮件模板不存在'
      });
    }

    res.json({
      success: true,
      message: '邮件模板删除成功'
    });
  } catch (error) {
    console.error('删除邮件模板错误:', error);
    res.status(500).json({
      success: false,
      message: '删除邮件模板失败',
      error: error.message
    });
  }
});

// 批量预览模板（支持联系人和客户）
router.post('/batch-preview', authenticateToken, async (req, res) => {
  try {
    const { template_id, contact_ids, customer_ids, template_title, template_content } = req.body;

    // 检查收件人列表
    if ((!contact_ids || !Array.isArray(contact_ids) || contact_ids.length === 0) && 
        (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0)) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供联系人ID列表或客户ID列表'
      });
    }

    // 如果没有提供 template_id，则必须提供 template_title 和 template_content
    if (!template_id && (!template_title || !template_content)) {
      return res.status(400).json({
        success: false,
        message: '请提供模板ID或者邮件主题和内容'
      });
    }

    const result = await emailTemplateService.batchPreviewTemplate(
      template_id, 
      {
        contact_ids: contact_ids || [],
        customer_ids: customer_ids || [],
        template_title,
        template_content
      },
      req.user.id
    );

    res.json({
      success: true,
      template_id: result.template_id,
      previews: result.previews,
      total_recipients: result.total_recipients,
      message: '批量预览成功'
    });
  } catch (error) {
    console.error('批量预览错误:', error);
    res.status(500).json({
      success: false,
      message: '批量预览失败',
      error: error.message
    });
  }
});

module.exports = router;
