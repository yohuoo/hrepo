const { EmailHistory, Contact, Customer, UserEmailBinding } = require('../models');
const NotificationService = require('./NotificationService');
const axios = require('axios');

class EmailSendingService {
  constructor() {}

  // 批量发送邮件（模拟）
  async sendBatchEmails(emailData, userId) {
    try {
      const {
        template_id,
        template_title,
        sender_email_binding_id,
        recipients // [{type: 'contact'|'customer', id, name, email, company, rendered_title, rendered_content}]
      } = emailData;

      // 验证发件邮箱
      const senderBinding = await UserEmailBinding.findOne({
        where: {
          id: sender_email_binding_id,
          user_id: userId,
          status: 'active'
        }
      });

      if (!senderBinding) {
        throw new Error('发件邮箱不存在或未激活');
      }

      const sentEmails = [];

      // 为每个收件人创建发送记录
      for (const recipient of recipients) {
        const emailRecord = await EmailHistory.create({
          user_id: userId,
          sender_email_binding_id: sender_email_binding_id,
          send_address: senderBinding.email_address,
          receive_address: recipient.email,
          title: recipient.rendered_title || template_title,
          content: recipient.rendered_content,
          send_time: new Date(),
          customer_name: recipient.name,
          customer_id: recipient.type === 'customer' ? recipient.id : null,
          contact_id: recipient.type === 'contact' ? recipient.id : null,
          email_type: 'sent',
          status: 'sent'
        });

        sentEmails.push({
          email_id: emailRecord.id,
          recipient_type: recipient.type,
          recipient_id: recipient.id,
          recipient_name: recipient.name,
          recipient_email: recipient.email,
          status: 'sent'
        });
      }

      console.log(`✅ 批量发送成功: 共 ${sentEmails.length} 封邮件`);

      return {
        success: true,
        total_sent: sentEmails.length,
        sent_emails: sentEmails
      };
    } catch (error) {
      throw new Error(`批量发送邮件失败: ${error.message}`);
    }
  }

  // 生成回复内容（使用OpenAI）
  async generateReplyContent(originalEmail) {
    try {
      console.log(`🤖 生成回复内容...`);

      const prompt = `你是收件人"${originalEmail.customer_name}"，刚收到一封来自供应商的邮件。

邮件标题: ${originalEmail.title}
邮件内容:
${originalEmail.content}

请以收件人的身份，生成一封简短、自然的回复邮件（50-150字）。回复内容应该表现出以下特征之一（随机选择）：
1. 对产品感兴趣，想了解更多信息
2. 询问价格、交货期等商务问题
3. 委婉拒绝，但表示可能未来合作
4. 简单确认收到，表示需要时间考虑

请直接返回回复内容，不要包含称呼和签名。`;

      // 构建请求体
      const requestBody = {
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的商务邮件助手，擅长生成自然、恰当的商务回复。'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      // GPT-5模型使用max_completion_tokens，其他模型使用max_tokens
      const model = process.env.OPENAI_MODEL || 'gpt-4';
      if (model.includes('gpt-5')) {
        requestBody.max_completion_tokens = 2000;  // GPT-5需要更多token用于生成内容
        // GPT-5不支持temperature参数
      } else {
        requestBody.max_tokens = 500;
        requestBody.temperature = 0.8;
      }

      console.log(`🔍 OpenAI请求体:`, JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        `${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(`🔍 OpenAI响应:`, JSON.stringify(response.data, null, 2));

      const replyContent = response.data.choices[0]?.message?.content?.trim() || '';
      
      if (!replyContent) {
        console.warn(`⚠️ OpenAI返回内容为空，使用备用回复`);
        console.warn(`⚠️ OpenAI完整响应:`, JSON.stringify(response.data, null, 2));
        return `感谢您的邮件。我们对您的产品很感兴趣，能否提供更详细的产品资料和报价？期待您的回复。`;
      }
      
      console.log(`✅ 回复内容生成成功 (长度: ${replyContent.length}): ${replyContent.substring(0, 100)}...`);

      return replyContent;
    } catch (error) {
      console.error(`❌ 生成回复内容失败 - 状态码:`, error.response?.status);
      console.error(`❌ 错误详情:`, JSON.stringify(error.response?.data, null, 2) || error.message);
      // 返回备用回复
      return `感谢您的邮件。我们对您的产品很感兴趣，能否提供更详细的产品资料和报价？期待您的回复。`;
    }
  }

  // 模拟自动回复
  async simulateReplies(sentEmails, userId) {
    try {
      const replies = [];

      // 随机选择30-50%的邮件进行回复
      const replyRate = 0.3 + Math.random() * 0.2;
      const replyCount = Math.max(1, Math.floor(sentEmails.length * replyRate));

      // 随机打乱并选择
      const shuffled = [...sentEmails].sort(() => Math.random() - 0.5);
      const selectedForReply = shuffled.slice(0, replyCount);

      console.log(`📧 模拟回复: 将回复 ${selectedForReply.length}/${sentEmails.length} 封邮件`);

      for (const sentEmail of selectedForReply) {
        // 生成随机延迟（5-30秒）
        const delay = 5000 + Math.random() * 25000;
        
        // 延迟后执行回复
        setTimeout(async () => {
          try {
            await this.createReply(sentEmail.email_id, userId);
          } catch (error) {
            console.error(`❌ 创建回复失败 (Email ID: ${sentEmail.email_id}):`, error.message);
          }
        }, delay);

        replies.push({
          original_email_id: sentEmail.email_id,
          recipient: sentEmail.recipient_email,
          scheduled_delay: Math.round(delay / 1000) + '秒'
        });
      }

      return {
        total_replies_scheduled: replies.length,
        replies
      };
    } catch (error) {
      throw new Error(`模拟回复失败: ${error.message}`);
    }
  }

  // 创建回复记录
  async createReply(originalEmailId, userId) {
    try {
      // 获取原始邮件
      const originalEmail = await EmailHistory.findOne({
        where: { id: originalEmailId }
      });

      if (!originalEmail) {
        throw new Error('原始邮件不存在');
      }

      // 生成回复内容
      const replyContent = await this.generateReplyContent(originalEmail);
      console.log(`📝 准备保存回复内容 (长度: ${replyContent.length}): "${replyContent.substring(0, 100)}..."`);

      // 生成回复标题
      const replyTitle = originalEmail.title.startsWith('Re:') 
        ? originalEmail.title 
        : `Re: ${originalEmail.title}`;

      // 创建回复记录
      const replyEmail = await EmailHistory.create({
        user_id: userId,
        send_address: originalEmail.receive_address,
        receive_address: originalEmail.send_address,
        title: replyTitle,
        content: replyContent,
        send_time: new Date(),
        customer_name: originalEmail.customer_name,
        customer_id: originalEmail.customer_id,
        contact_id: originalEmail.contact_id,
        email_type: 'received',
        parent_email_id: originalEmailId,
        status: 'sent'
      });

      console.log(`✅ 回复创建成功: ${replyEmail.receive_address} → ${replyEmail.send_address}`);

      // 发送通知
      await this.sendEmailNotification(userId, replyEmail, {
        name: originalEmail.customer_name || originalEmail.receive_address.split('@')[0],
        type: 'reply'
      });

      // 如果是联系人回复，自动转为客户
      if (originalEmail.contact_id && !originalEmail.customer_id) {
        await this.convertContactToCustomer(originalEmail.contact_id, userId);
      }

      // 更新客户/联系人的邮件往来次数
      if (originalEmail.customer_id) {
        await Customer.increment('email_count', {
          where: { id: originalEmail.customer_id }
        });
        await Customer.update(
          { last_communication_time: new Date() },
          { where: { id: originalEmail.customer_id } }
        );
      }

      return replyEmail;
    } catch (error) {
      console.error(`❌ 创建回复失败:`, error);
      throw error;
    }
  }

  // 将联系人转为客户
  async convertContactToCustomer(contactId, userId) {
    try {
      const contact = await Contact.findOne({
        where: { id: contactId, user_id: userId }
      });

      if (!contact) {
        return null;
      }

      // 检查是否已经是客户
      const existingCustomer = await Customer.findOne({
        where: { email: contact.email, user_id: userId }
      });

      if (existingCustomer) {
        console.log(`ℹ️ 联系人 ${contact.name} 已经是客户`);
        
        // 更新邮件历史记录关联
        await EmailHistory.update(
          { customer_id: existingCustomer.id },
          { where: { contact_id: contactId, user_id: userId } }
        );

        return existingCustomer;
      }

      // 创建新客户
      const customer = await Customer.create({
        user_id: userId,
        name: contact.name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        email_count: 1,
        communication_progress: '跟进中',
        interest_level: '中等兴趣',
        last_communication_time: new Date()
      });

      console.log(`✅ 联系人 ${contact.name} 已转为客户 (ID: ${customer.id})`);

      // 更新邮件历史记录关联
      await EmailHistory.update(
        { customer_id: customer.id },
        { where: { contact_id: contactId, user_id: userId } }
      );

      return customer;
    } catch (error) {
      console.error(`❌ 转换联系人为客户失败:`, error);
      throw new Error(`转换联系人为客户失败: ${error.message}`);
    }
  }

  /**
   * 发送邮件通知
   */
  async sendEmailNotification(userId, emailRecord, senderInfo) {
    try {
      const senderName = senderInfo.name || '未知用户';
      
      await NotificationService.addNotification(
        userId,
        'email',
        '新邮件',
        `${senderName}向你发来了邮件`,
        {
          emailId: emailRecord.id,
          senderName: senderName,
          subject: emailRecord.title,
          senderEmail: emailRecord.send_address,
          emailType: 'received'
        }
      );

      console.log(`✅ 邮件通知已发送: ${userId} - ${senderName}`);
    } catch (error) {
      console.error('发送邮件通知失败:', error);
    }
  }
}

module.exports = EmailSendingService;

