const { Op } = require('sequelize');
const { Contact, ContactTag } = require('../models');

class ContactService {
  constructor() {}

  async createContact(contactData, userId) {
    try {
      // 检查是否已存在相同邮箱的联系人
      const existingContact = await Contact.findOne({
        where: {
          email: contactData.email,
          user_id: userId
        }
      });
      
      if (existingContact) {
        throw new Error('该邮箱的联系人已存在');
      }
      
      const contact = await Contact.create({
        ...contactData,
        user_id: userId
      });
      return contact;
    } catch (error) {
      throw new Error(`创建联系人失败: ${error.message}`);
    }
  }

  async getContact(contactId, userId) {
    try {
      const contact = await Contact.findOne({
        where: {
          id: contactId,
          user_id: userId
        }
      });
      return contact;
    } catch (error) {
      throw new Error(`获取联系人失败: ${error.message}`);
    }
  }

  async getContacts(userId, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        search = null,
        tagNames = null,
        startDate = null,
        endDate = null
      } = options;

      const where = { user_id: userId };

      // 搜索条件
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { first_name: { [Op.iLike]: `%${search}%` } },
          { last_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { company: { [Op.iLike]: `%${search}%` } },
          { domain: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // 标签筛选
      if (tagNames && tagNames.length > 0) {
        const tagConditions = tagNames.map(tagName => ({
          tags: { [Op.iLike]: `%"${tagName}"%` }
        }));
        where[Op.and] = where[Op.and] || [];
        where[Op.and].push({ [Op.or]: tagConditions });
      }

      // 日期筛选
      if (startDate || endDate) {
        where.created_at = {};
        if (startDate) {
          where.created_at[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.created_at[Op.lte] = new Date(endDate);
        }
      }

      const { count, rows } = await Contact.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      return {
        contacts: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      throw new Error(`获取联系人列表失败: ${error.message}`);
    }
  }

  async updateContact(contactId, contactData, userId) {
    try {
      const [updatedRowsCount] = await Contact.update(contactData, {
        where: {
          id: contactId,
          user_id: userId
        }
      });

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getContact(contactId, userId);
    } catch (error) {
      throw new Error(`更新联系人失败: ${error.message}`);
    }
  }

  async deleteContact(contactId, userId) {
    try {
      const deletedRowsCount = await Contact.destroy({
        where: {
          id: contactId,
          user_id: userId
        }
      });

      return deletedRowsCount > 0;
    } catch (error) {
      throw new Error(`删除联系人失败: ${error.message}`);
    }
  }

  async addTagsToContact(contactId, tagNames, userId) {
    try {
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        throw new Error('联系人不存在');
      }

      const currentTags = contact.tags || [];
      const newTags = [...new Set([...currentTags, ...tagNames])];
      
      await contact.update({ tags: newTags });
      return contact;
    } catch (error) {
      throw new Error(`添加标签失败: ${error.message}`);
    }
  }

  async removeTagsFromContact(contactId, tagNames, userId) {
    try {
      const contact = await this.getContact(contactId, userId);
      if (!contact) {
        throw new Error('联系人不存在');
      }

      const currentTags = contact.tags || [];
      const newTags = currentTags.filter(tag => !tagNames.includes(tag));
      
      await contact.update({ tags: newTags });
      return contact;
    } catch (error) {
      throw new Error(`移除标签失败: ${error.message}`);
    }
  }

  async searchContacts(query, userId) {
    try {
      const contacts = await Contact.findAll({
        where: {
          user_id: userId,
          [Op.or]: [
            { name: { [Op.iLike]: `%${query}%` } },
            { first_name: { [Op.iLike]: `%${query}%` } },
            { last_name: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
            { company: { [Op.iLike]: `%${query}%` } },
            { domain: { [Op.iLike]: `%${query}%` } }
          ]
        },
        order: [['created_at', 'DESC']],
        limit: 50
      });

      return contacts;
    } catch (error) {
      throw new Error(`搜索联系人失败: ${error.message}`);
    }
  }
}

module.exports = ContactService;
