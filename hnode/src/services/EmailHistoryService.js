const { EmailHistory, Customer, Contact } = require('../models');
const { Op } = require('sequelize');

class EmailHistoryService {
  constructor() {}

  // 创建邮件往来记录
  async createEmailHistory(emailData, userId) {
    try {
      const emailHistory = await EmailHistory.create({
        user_id: userId,
        send_address: emailData.send_address,
        receive_address: emailData.receive_address,
        title: emailData.title || null,
        content: emailData.content || null,
        send_time: emailData.send_time || new Date(),
        customer_name: emailData.customer_name || null,
        customer_id: emailData.customer_id || null,
        contact_id: emailData.contact_id || null
      });

      return emailHistory;
    } catch (error) {
      throw new Error(`创建邮件往来记录失败: ${error.message}`);
    }
  }

  // 获取用户与客户/联系人的邮件往来记录
  async getUserEmailHistory(userId, options = {}) {
    try {
      const {
        query = '',
        customer_id = null,
        contact_id = null,
        email_type = null,              // 邮件类型筛选 ('sent' 或 'received')
        sender_email_binding_id = null, // 按发件邮箱绑定ID筛选
        send_address = null,            // 按发件邮箱地址筛选
        receive_address = null,         // 按收件邮箱地址筛选
        page = 1,
        pageSize = 20
      } = options;

      let where = { user_id: userId };

      // 如果指定了customer_id，查询该用户所有邮箱与该客户邮箱的所有往来
      if (customer_id) {
        // 先获取客户的邮箱地址
        const customer = await Customer.findOne({
          where: { id: customer_id, user_id: userId },
          attributes: ['email']
        });

        if (customer) {
          const customerEmail = customer.email;
          
          // 查询条件：用户的邮件中，发件人或收件人包含客户邮箱
          where = {
            user_id: userId,
            [Op.or]: [
              { send_address: customerEmail },     // 客户发给我
              { receive_address: customerEmail }   // 我发给客户
            ]
          };
        } else {
          // 如果客户不存在，返回空结果
          where.customer_id = -1;
        }
      }
      // 如果指定了contact_id，查询该用户所有邮箱与该联系人邮箱的所有往来
      else if (contact_id) {
        // 先获取联系人的邮箱地址
        const contact = await Contact.findOne({
          where: { id: contact_id, user_id: userId },
          attributes: ['email']
        });

        if (contact) {
          const contactEmail = contact.email;
          
          // 查询条件：用户的邮件中，发件人或收件人包含联系人邮箱
          where = {
            user_id: userId,
            [Op.or]: [
              { send_address: contactEmail },      // 联系人发给我
              { receive_address: contactEmail }    // 我发给联系人
            ]
          };
        } else {
          // 如果联系人不存在，返回空结果
          where.contact_id = -1;
        }
      }

      // 如果指定了邮件类型，添加筛选条件
      if (email_type && (email_type === 'sent' || email_type === 'received')) {
        // 如果已经有复杂的 Op.or 条件，需要合并
        if (where[Op.or]) {
          where = {
            [Op.and]: [
              where,
              { email_type: email_type }
            ]
          };
        } else {
          where.email_type = email_type;
        }
      }

      // 如果指定了发件邮箱绑定ID，添加筛选条件
      if (sender_email_binding_id) {
        if (where[Op.and]) {
          where[Op.and].push({ sender_email_binding_id: sender_email_binding_id });
        } else if (where[Op.or]) {
          where = {
            [Op.and]: [
              where,
              { sender_email_binding_id: sender_email_binding_id }
            ]
          };
        } else {
          where.sender_email_binding_id = sender_email_binding_id;
        }
      }

      // 如果指定了发件邮箱地址，添加筛选条件
      if (send_address) {
        if (where[Op.and]) {
          where[Op.and].push({ send_address: { [Op.iLike]: `%${send_address}%` } });
        } else if (where[Op.or]) {
          where = {
            [Op.and]: [
              where,
              { send_address: { [Op.iLike]: `%${send_address}%` } }
            ]
          };
        } else {
          where.send_address = { [Op.iLike]: `%${send_address}%` };
        }
      }

      // 如果指定了收件邮箱地址，添加筛选条件
      if (receive_address) {
        if (where[Op.and]) {
          where[Op.and].push({ receive_address: { [Op.iLike]: `%${receive_address}%` } });
        } else if (where[Op.or]) {
          where = {
            [Op.and]: [
              where,
              { receive_address: { [Op.iLike]: `%${receive_address}%` } }
            ]
          };
        } else {
          where.receive_address = { [Op.iLike]: `%${receive_address}%` };
        }
      }

      // 如果有查询字符串，在现有条件基础上进行模糊搜索
      if (query && query.trim() !== '') {
        const searchConditions = [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
          { customer_name: { [Op.iLike]: `%${query}%` } }
        ];
        
        // 如果已经有其他条件，需要合并
        if (where[Op.or] || where[Op.and]) {
          where = {
            [Op.and]: [
              where,
              { [Op.or]: searchConditions }
            ]
          };
        } else {
          where[Op.or] = searchConditions;
        }
      }

      const { count, rows } = await EmailHistory.findAndCountAll({
        where,
        include: [
          {
            model: Customer,
            as: 'customer',
            required: false,
            attributes: ['id', 'name', 'email', 'company']
          },
          {
            model: Contact,
            as: 'contact',
            required: false,
            attributes: ['id', 'name', 'email', 'company']
          },
          {
            model: require('../models/UserEmailBinding'),
            as: 'senderEmailBinding',
            required: false,
            attributes: ['id', 'email_address', 'status', 'is_default']
          }
        ],
        order: [['send_time', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      return {
        email_history: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      throw new Error(`获取邮件往来记录失败: ${error.message}`);
    }
  }

  // 获取单个邮件往来记录
  async getEmailHistoryById(historyId, userId) {
    try {
      const emailHistory = await EmailHistory.findOne({
        where: {
          id: historyId,
          user_id: userId
        },
        include: [
          {
            model: Customer,
            as: 'customer',
            required: false,
            attributes: ['id', 'name', 'email', 'company']
          },
          {
            model: Contact,
            as: 'contact',
            required: false,
            attributes: ['id', 'name', 'email', 'company']
          }
        ]
      });

      return emailHistory;
    } catch (error) {
      throw new Error(`获取邮件往来记录失败: ${error.message}`);
    }
  }

  // 删除邮件往来记录
  async deleteEmailHistory(historyId, userId) {
    try {
      const deletedRowsCount = await EmailHistory.destroy({
        where: {
          id: historyId,
          user_id: userId
        }
      });

      return deletedRowsCount > 0;
    } catch (error) {
      throw new Error(`删除邮件往来记录失败: ${error.message}`);
    }
  }

}

module.exports = EmailHistoryService;
