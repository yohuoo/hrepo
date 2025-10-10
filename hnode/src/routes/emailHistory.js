const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EmailHistoryService = require('../services/EmailHistoryService');

const emailHistoryService = new EmailHistoryService();

// 创建邮件往来记录
router.post('/', authenticateToken, async (req, res) => {
  try {
    const emailHistory = await emailHistoryService.createEmailHistory(req.body, req.user.id);

    res.status(201).json({
      success: true,
      email_history: {
        id: emailHistory.id,
        user_id: emailHistory.user_id,
        send_address: emailHistory.send_address,
        receive_address: emailHistory.receive_address,
        title: emailHistory.title,
        content: emailHistory.content,
        send_time: emailHistory.send_time,
        customer_name: emailHistory.customer_name,
        customer_id: emailHistory.customer_id,
        contact_id: emailHistory.contact_id,
        created_at: emailHistory.created_at,
        updated_at: emailHistory.updated_at
      },
      message: '邮件往来记录创建成功'
    });
  } catch (error) {
    console.error('创建邮件往来记录错误:', error);
    res.status(500).json({
      success: false,
      message: '创建邮件往来记录失败',
      error: error.message
    });
  }
});

// 获取邮件往来记录列表（支持模糊搜索）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      query = '', 
      customer_id, 
      contact_id, 
      email_type, 
      sender_email_binding_id,  // 新增：按发件邮箱筛选
      send_address,             // 新增：按发件邮箱地址筛选
      receive_address,          // 新增：按收件邮箱地址筛选
      page = 1, 
      pageSize = 20 
    } = req.query;

    const result = await emailHistoryService.getUserEmailHistory(req.user.id, {
      query,
      customer_id: customer_id ? parseInt(customer_id) : null,
      contact_id: contact_id ? parseInt(contact_id) : null,
      email_type: email_type || null,
      sender_email_binding_id: sender_email_binding_id ? parseInt(sender_email_binding_id) : null,
      send_address: send_address || null,
      receive_address: receive_address || null,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    const email_history = result.email_history.map(history => ({
      id: history.id,
      user_id: history.user_id,
      send_address: history.send_address,
      receive_address: history.receive_address,
      title: history.title,
      content: history.content,
      send_time: history.send_time,
      customer_name: history.customer_name,
      customer_id: history.customer_id,
      contact_id: history.contact_id,
      sender_email_binding_id: history.sender_email_binding_id,
      email_type: history.email_type,
      parent_email_id: history.parent_email_id,
      status: history.status,
      customer: history.customer ? {
        id: history.customer.id,
        name: history.customer.name,
        email: history.customer.email,
        company: history.customer.company
      } : null,
      contact: history.contact ? {
        id: history.contact.id,
        name: history.contact.name,
        email: history.contact.email,
        company: history.contact.company
      } : null,
      sender_email_binding: history.senderEmailBinding ? {
        id: history.senderEmailBinding.id,
        email_address: history.senderEmailBinding.email_address,
        status: history.senderEmailBinding.status,
        is_default: history.senderEmailBinding.is_default
      } : null,
      created_at: history.created_at,
      updated_at: history.updated_at
    }));

    res.json({
      success: true,
      email_history,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      total_pages: result.totalPages
    });
  } catch (error) {
    console.error('获取邮件往来记录列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邮件往来记录列表失败',
      error: error.message
    });
  }
});

// 获取单个邮件往来记录
router.get('/:historyId', authenticateToken, async (req, res) => {
  try {
    const emailHistory = await emailHistoryService.getEmailHistoryById(
      parseInt(req.params.historyId),
      req.user.id
    );

    if (!emailHistory) {
      return res.status(404).json({
        success: false,
        message: '邮件往来记录不存在'
      });
    }

    res.json({
      success: true,
      email_history: {
        id: emailHistory.id,
        user_id: emailHistory.user_id,
        send_address: emailHistory.send_address,
        receive_address: emailHistory.receive_address,
        title: emailHistory.title,
        content: emailHistory.content,
        send_time: emailHistory.send_time,
        customer_name: emailHistory.customer_name,
        customer_id: emailHistory.customer_id,
        contact_id: emailHistory.contact_id,
        customer: emailHistory.customer ? {
          id: emailHistory.customer.id,
          name: emailHistory.customer.name,
          email: emailHistory.customer.email,
          company: emailHistory.customer.company
        } : null,
        contact: emailHistory.contact ? {
          id: emailHistory.contact.id,
          name: emailHistory.contact.name,
          email: emailHistory.contact.email,
          company: emailHistory.contact.company
        } : null,
        created_at: emailHistory.created_at,
        updated_at: emailHistory.updated_at
      }
    });
  } catch (error) {
    console.error('获取邮件往来记录错误:', error);
    res.status(500).json({
      success: false,
      message: '获取邮件往来记录失败',
      error: error.message
    });
  }
});

// 删除邮件往来记录
router.delete('/:historyId', authenticateToken, async (req, res) => {
  try {
    const success = await emailHistoryService.deleteEmailHistory(
      parseInt(req.params.historyId),
      req.user.id
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        message: '邮件往来记录不存在'
      });
    }

    res.json({
      success: true,
      message: '邮件往来记录删除成功'
    });
  } catch (error) {
    console.error('删除邮件往来记录错误:', error);
    res.status(500).json({
      success: false,
      message: '删除邮件往来记录失败',
      error: error.message
    });
  }
});

module.exports = router;
