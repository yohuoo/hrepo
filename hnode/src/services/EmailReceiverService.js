const { EmailHistory, Contact, Customer, UserEmailBinding } = require('../models');
const NotificationService = require('./NotificationService');

class EmailReceiverService {
  constructor() {}

  /**
   * 模拟接收邮件（实际项目中这里会连接邮件服务器）
   * @param {Object} emailData - 邮件数据
   * @param {number} userId - 用户ID
   */
  async simulateReceiveEmail(emailData, userId) {
    try {
      console.log(`📧 模拟接收邮件: ${emailData.from} -> ${emailData.to}`);

      // 查找发件人信息
      const senderInfo = await this.findSenderInfo(emailData.from, userId);
      
      // 创建邮件记录
      const emailRecord = await EmailHistory.create({
        user_id: userId,
        sender_email_binding_id: null, // 接收的邮件没有sender_email_binding_id
        send_address: emailData.from,
        receive_address: emailData.to,
        title: emailData.subject,
        content: emailData.content,
        send_time: new Date(),
        customer_name: senderInfo.name,
        customer_id: senderInfo.customer_id,
        contact_id: senderInfo.contact_id,
        email_type: 'received',
        status: 'received'
      });

      // 发送通知
      await this.sendEmailNotification(userId, emailRecord, senderInfo);

      return emailRecord;
    } catch (error) {
      console.error('模拟接收邮件失败:', error);
      throw error;
    }
  }

  /**
   * 查找发件人信息
   */
  async findSenderInfo(emailAddress, userId) {
    try {
      // 先在联系人中查找
      const contact = await Contact.findOne({
        where: {
          email: emailAddress,
          user_id: userId
        }
      });

      if (contact) {
        return {
          name: contact.name,
          customer_id: null,
          contact_id: contact.id,
          type: 'contact'
        };
      }

      // 再在客户中查找
      const customer = await Customer.findOne({
        where: {
          email: emailAddress,
          user_id: userId
        }
      });

      if (customer) {
        return {
          name: customer.name,
          customer_id: customer.id,
          contact_id: null,
          type: 'customer'
        };
      }

      // 如果都没找到，使用邮箱地址作为名称
      return {
        name: emailAddress.split('@')[0],
        customer_id: null,
        contact_id: null,
        type: 'unknown'
      };
    } catch (error) {
      console.error('查找发件人信息失败:', error);
      return {
        name: emailAddress.split('@')[0],
        customer_id: null,
        contact_id: null,
        type: 'unknown'
      };
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

  /**
   * 批量模拟接收邮件（用于测试）
   */
  async simulateBatchReceiveEmails(userId, count = 3) {
    try {
      const testEmails = [
        {
          from: 'zhangsan@example.com',
          to: 'user@company.com',
          subject: '关于项目合作的邮件',
          content: '您好，我们对您的产品很感兴趣，希望能进一步了解合作细节。'
        },
        {
          from: 'lisi@tech.com',
          to: 'user@company.com', 
          subject: '询价邮件',
          content: '请提供贵公司产品的详细报价和技术参数。'
        },
        {
          from: 'wangwu@startup.com',
          to: 'user@company.com',
          subject: '会议邀请',
          content: '我们想邀请您参加下周的产品演示会议。'
        }
      ];

      const results = [];
      
      for (let i = 0; i < Math.min(count, testEmails.length); i++) {
        // 随机延迟，模拟真实邮件接收
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        
        const emailRecord = await this.simulateReceiveEmail(testEmails[i], userId);
        results.push(emailRecord);
      }

      return {
        success: true,
        count: results.length,
        emails: results
      };
    } catch (error) {
      console.error('批量模拟接收邮件失败:', error);
      throw error;
    }
  }
}

module.exports = new EmailReceiverService();
