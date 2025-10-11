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

    // 动态查找每封邮件对应邮箱的当前身份（优先客户，其次联系人）
    const { Customer, Contact } = require('../models');
    const email_history = await Promise.all(result.email_history.map(async (history) => {
      // 根据邮件类型确定对方的邮箱地址
      const otherEmail = history.email_type === 'sent' ? history.receive_address : history.send_address;
      
      // 优先查找客户（当前状态）
      let currentCustomer = await Customer.findOne({
        where: { 
          user_id: req.user.id,
          email: otherEmail 
        },
        attributes: ['id', 'name', 'email', 'company']
      });
      
      // 如果不是客户，查找联系人（当前状态）
      let currentContact = null;
      if (!currentCustomer) {
        currentContact = await Contact.findOne({
          where: { 
            user_id: req.user.id,
            email: otherEmail 
          },
          attributes: ['id', 'name', 'email', 'company']
        });
      }
      
      return {
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
        // 使用当前状态（而不是历史关联）
        customer: currentCustomer ? {
          id: currentCustomer.id,
          name: currentCustomer.name,
          email: currentCustomer.email,
          company: currentCustomer.company
        } : null,
        contact: currentContact ? {
          id: currentContact.id,
          name: currentContact.name,
          email: currentContact.email,
          company: currentContact.company
        } : null,
        sender_email_binding: history.senderEmailBinding ? {
          id: history.senderEmailBinding.id,
          email_address: history.senderEmailBinding.email_address,
          status: history.senderEmailBinding.status,
          is_default: history.senderEmailBinding.is_default
        } : null,
        created_at: history.created_at,
        updated_at: history.updated_at
      };
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

    // 动态查找对方邮箱的当前身份
    const { Customer, Contact } = require('../models');
    const otherEmail = emailHistory.email_type === 'sent' ? emailHistory.receive_address : emailHistory.send_address;
    
    let currentCustomer = await Customer.findOne({
      where: { 
        user_id: req.user.id,
        email: otherEmail 
      },
      attributes: ['id', 'name', 'email', 'company']
    });
    
    let currentContact = null;
    if (!currentCustomer) {
      currentContact = await Contact.findOne({
        where: { 
          user_id: req.user.id,
          email: otherEmail 
        },
        attributes: ['id', 'name', 'email', 'company']
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
        // 使用当前状态
        customer: currentCustomer ? {
          id: currentCustomer.id,
          name: currentCustomer.name,
          email: currentCustomer.email,
          company: currentCustomer.company
        } : null,
        contact: currentContact ? {
          id: currentContact.id,
          name: currentContact.name,
          email: currentContact.email,
          company: currentContact.company
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
