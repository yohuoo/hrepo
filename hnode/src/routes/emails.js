const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EmailTemplateService = require('../services/EmailTemplateService');
const EmailSendingService = require('../services/EmailSendingService');

const emailTemplateService = new EmailTemplateService();
const emailSendingService = new EmailSendingService();

// 批量发送邮件（模拟）
router.post('/send-batch', authenticateToken, async (req, res) => {
  try {
    const {
      template_id,
      template_title,  // 如果没有 template_id，则使用这个
      template_content,  // 如果没有 template_id，则使用这个
      sender_email_binding_id,  // 可选，不传则使用默认邮箱
      contact_ids = [],
      customer_ids = []
    } = req.body;

    // 验证参数：要么提供 template_id，要么提供 template_title 和 template_content
    if (!template_id && (!template_title || !template_content)) {
      return res.status(400).json({
        success: false,
        message: '请提供模板ID或者邮件主题和内容'
      });
    }

    // 如果没有提供sender_email_binding_id，使用默认邮箱
    let finalSenderBindingId = sender_email_binding_id;
    if (!finalSenderBindingId) {
      const { UserEmailBinding } = require('../models');
      const defaultBinding = await UserEmailBinding.findOne({
        where: {
          user_id: req.user.id,
          is_default: true,
          status: 'active'
        }
      });

      if (!defaultBinding) {
        return res.status(400).json({
          success: false,
          message: '未找到可用的默认邮箱，请先设置默认邮箱或手动指定发件邮箱'
        });
      }

      finalSenderBindingId = defaultBinding.id;
      console.log(`📧 使用默认邮箱: ${defaultBinding.email_address} (ID: ${finalSenderBindingId})`);
    }

    if (contact_ids.length === 0 && customer_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '至少需要提供一个收件人'
      });
    }

    // 1. 获取模板预览（渲染后的内容）
    const previewResult = await emailTemplateService.batchPreviewTemplate(
      template_id,
      { 
        contact_ids, 
        customer_ids,
        template_title,
        template_content
      },
      req.user.id
    );

    // 2. 批量发送邮件
    const sendResult = await emailSendingService.sendBatchEmails(
      {
        template_id,
        template_title: previewResult.previews[0]?.template_title || '无标题',
        sender_email_binding_id: finalSenderBindingId,
        recipients: previewResult.previews.map(p => ({
          type: p.recipient_type,
          id: p.recipient_id,
          name: p.recipient_name,
          email: p.recipient_email,
          company: p.recipient_company,
          rendered_title: p.template_title,
          rendered_content: p.rendered_content
        }))
      },
      req.user.id
    );

    // 3. 触发自动回复（异步）
    emailSendingService.simulateReplies(
      sendResult.sent_emails,
      req.user.id
    ).then(replyResult => {
      console.log(`📧 自动回复已调度: ${replyResult.total_replies_scheduled} 封`);
    }).catch(error => {
      console.error(`❌ 自动回复调度失败:`, error);
    });

    res.json({
      success: true,
      message: '邮件发送成功',
      total_sent: sendResult.total_sent,
      sent_emails: sendResult.sent_emails,
      auto_reply_info: '部分收件人将在5-30秒内自动回复'
    });
  } catch (error) {
    console.error('批量发送邮件错误:', error);
    res.status(500).json({
      success: false,
      message: '批量发送邮件失败',
      error: error.message
    });
  }
});

// 手动触发模拟回复（调试用）
router.post('/simulate-replies', authenticateToken, async (req, res) => {
  try {
    const { email_ids } = req.body;

    if (!email_ids || !Array.isArray(email_ids) || email_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '邮件ID列表是必需的'
      });
    }

    const replies = [];
    for (const emailId of email_ids) {
      try {
        const reply = await emailSendingService.createReply(emailId, req.user.id);
        replies.push({
          original_email_id: emailId,
          reply_email_id: reply.id,
          status: 'success'
        });
      } catch (error) {
        replies.push({
          original_email_id: emailId,
          error: error.message,
          status: 'failed'
        });
      }
    }

    res.json({
      success: true,
      message: '模拟回复完成',
      replies
    });
  } catch (error) {
    console.error('模拟回复错误:', error);
    res.status(500).json({
      success: false,
      message: '模拟回复失败',
      error: error.message
    });
  }
});

// 查看邮件线程（邮件和回复）
router.get('/thread/:emailId', authenticateToken, async (req, res) => {
  try {
    const { EmailHistory } = require('../models');
    const emailId = parseInt(req.params.emailId);

    // 获取原始邮件
    const originalEmail = await EmailHistory.findOne({
      where: {
        id: emailId,
        user_id: req.user.id
      }
    });

    if (!originalEmail) {
      return res.status(404).json({
        success: false,
        message: '邮件不存在'
      });
    }

    // 获取所有回复
    const replies = await EmailHistory.findAll({
      where: {
        parent_email_id: emailId
      },
      order: [['send_time', 'ASC']]
    });

    // 获取父邮件（如果这是一个回复）
    let parentEmail = null;
    if (originalEmail.parent_email_id) {
      parentEmail = await EmailHistory.findOne({
        where: { id: originalEmail.parent_email_id }
      });
    }

    res.json({
      success: true,
      thread: {
        original_email: {
          id: originalEmail.id,
          from: originalEmail.send_address,
          to: originalEmail.receive_address,
          title: originalEmail.title,
          content: originalEmail.content,
          send_time: originalEmail.send_time,
          email_type: originalEmail.email_type,
          status: originalEmail.status
        },
        parent_email: parentEmail ? {
          id: parentEmail.id,
          from: parentEmail.send_address,
          to: parentEmail.receive_address,
          title: parentEmail.title,
          content: parentEmail.content,
          send_time: parentEmail.send_time
        } : null,
        replies: replies.map(reply => ({
          id: reply.id,
          from: reply.send_address,
          to: reply.receive_address,
          title: reply.title,
          content: reply.content,
          send_time: reply.send_time,
          email_type: reply.email_type,
          status: reply.status
        })),
        total_replies: replies.length
      }
    });
  } catch (error) {
    console.error('查看邮件线程错误:', error);
    res.status(500).json({
      success: false,
      message: '查看邮件线程失败',
      error: error.message
    });
  }
});

module.exports = router;

