const { EmailTemplate, Contact, Customer } = require('../models');

class EmailTemplateService {
  constructor() {}

  async createTemplate(templateData, userId) {
    try {
      const template = await EmailTemplate.create({
        ...templateData,
        user_id: userId
      });
      return template;
    } catch (error) {
      throw new Error(`创建邮件模板失败: ${error.message}`);
    }
  }

  async getTemplate(templateId, userId) {
    try {
      const template = await EmailTemplate.findOne({
        where: {
          id: templateId,
          user_id: userId
        }
      });
      return template;
    } catch (error) {
      throw new Error(`获取邮件模板失败: ${error.message}`);
    }
  }

  async getTemplates(userId, options = {}) {
    try {
      const { page = 1, pageSize = 20 } = options;

      const { count, rows } = await EmailTemplate.findAndCountAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      return {
        templates: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      throw new Error(`获取邮件模板列表失败: ${error.message}`);
    }
  }

  async updateTemplate(templateId, templateData, userId) {
    try {
      const [updatedRowsCount] = await EmailTemplate.update(templateData, {
        where: {
          id: templateId,
          user_id: userId
        }
      });

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getTemplate(templateId, userId);
    } catch (error) {
      throw new Error(`更新邮件模板失败: ${error.message}`);
    }
  }

  async deleteTemplate(templateId, userId) {
    try {
      const deletedRowsCount = await EmailTemplate.destroy({
        where: {
          id: templateId,
          user_id: userId
        }
      });

      return deletedRowsCount > 0;
    } catch (error) {
      throw new Error(`删除邮件模板失败: ${error.message}`);
    }
  }

  async batchPreviewTemplate(templateId, recipientIds, userId) {
    try {
      const { contact_ids = [], customer_ids = [], template_title, template_content } = recipientIds;
      
      // 如果提供了 template_id，则从数据库获取模板
      let template = null;
      let title = template_title;
      let content = template_content;
      
      if (templateId) {
        template = await this.getTemplate(templateId, userId);
        if (!template) {
          throw new Error('邮件模板不存在');
        }
        // 如果没有提供 template_title/template_content，使用模板中的值
        title = template_title || template.title;
        content = template_content || template.content;
      }
      
      // 如果没有 template_id，则必须提供 title 和 content
      if (!title || !content) {
        throw new Error('邮件主题和内容不能为空');
      }

      const previews = [];

      // 处理联系人（Contacts）
      if (contact_ids.length > 0) {
        const contacts = await Contact.findAll({
          where: {
            id: { [require('sequelize').Op.in]: contact_ids },
            user_id: userId
          }
        });

        contacts.forEach(contact => {
          const variables = {
            name: contact.name || '',
            firstName: contact.first_name || '',
            lastName: contact.last_name || '',
            email: contact.email || '',
            company: contact.company || '',
            contactCompany: contact.company || '',
            contactDomain: contact.domain || '',
            position: contact.position || '',
            domain: contact.domain || '',
            // 发送方信息（硬编码示例）
            senderName: '销售团队',
            myCompany: '我们公司',
            senderCompany: '我们公司',
            productName: '我们的产品',
            contactPhone: '400-123-4567'
          };

          // 使用 EmailTemplate 模型的 render 方法或者手动替换
          let renderedTitle, renderedContent;
          if (template) {
            renderedTitle = template.render(variables, title);
            renderedContent = template.render(variables, content);
          } else {
            // 手动替换变量
            renderedTitle = this.renderText(title, variables);
            renderedContent = this.renderText(content, variables);
          }

          previews.push({
            recipient_type: 'contact',  // 🔖 标识类型：联系人
            recipient_id: contact.id,
            recipient_name: contact.name,
            recipient_email: contact.email,
            recipient_company: contact.company,
            template_title: renderedTitle,
            rendered_content: renderedContent,
            variables_used: Object.keys(variables).filter(key => 
              content.includes(`{{${key}}}`) || title.includes(`{{${key}}}`)
            )
          });
        });
      }

      // 处理客户（Customers）
      if (customer_ids.length > 0) {
        const customers = await Customer.findAll({
          where: {
            id: { [require('sequelize').Op.in]: customer_ids },
            user_id: userId
          }
        });

        customers.forEach(customer => {
          const variables = {
            name: customer.name || '',
            firstName: customer.first_name || '',
            lastName: customer.last_name || '',
            email: customer.email || '',
            company: customer.company || '',
            customerCompany: customer.company || '',
            // 客户没有domain和position字段，提供默认值
            position: '',
            domain: '',
            // 发送方信息（硬编码示例）
            senderName: '销售团队',
            myCompany: '我们公司',
            senderCompany: '我们公司',
            productName: '我们的产品',
            contactPhone: '400-123-4567'
          };

          // 使用 EmailTemplate 模型的 render 方法或者手动替换
          let renderedTitle, renderedContent;
          if (template) {
            renderedTitle = template.render(variables, title);
            renderedContent = template.render(variables, content);
          } else {
            // 手动替换变量
            renderedTitle = this.renderText(title, variables);
            renderedContent = this.renderText(content, variables);
          }

          previews.push({
            recipient_type: 'customer',  // 🔖 标识类型：客户
            recipient_id: customer.id,
            recipient_name: customer.name,
            recipient_email: customer.email,
            recipient_company: customer.company,
            template_title: renderedTitle,
            rendered_content: renderedContent,
            variables_used: Object.keys(variables).filter(key => 
              content.includes(`{{${key}}}`) || title.includes(`{{${key}}}`)
            )
          });
        });
      }

      return {
        template_id: templateId,
        previews,
        total_recipients: previews.length,
        breakdown: {
          contacts: contact_ids.length,
          customers: customer_ids.length
        }
      };
    } catch (error) {
      throw new Error(`批量预览失败: ${error.message}`);
    }
  }

  // 手动渲染文本（替换变量）
  renderText(text, variables) {
    if (!text) return '';
    
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }
}

module.exports = EmailTemplateService;
