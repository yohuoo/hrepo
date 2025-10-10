const { UserEmailBinding } = require('../models');

class UserEmailBindingService {
  constructor() {}

  // 绑定邮箱
  async bindEmail(emailData, userId) {
    try {
      const { email_address, email_password } = emailData;

      // 检查是否已经绑定过这个邮箱
      const existingBinding = await UserEmailBinding.findOne({
        where: {
          user_id: userId,
          email_address: email_address
        }
      });

      if (existingBinding) {
        throw new Error('该邮箱地址已经绑定过了');
      }

      const binding = await UserEmailBinding.create({
        user_id: userId,
        email_address: email_address,
        email_password: email_password,
        status: 'active'
      });

      return binding;
    } catch (error) {
      throw new Error(`绑定邮箱失败: ${error.message}`);
    }
  }

  // 获取用户的邮箱绑定列表
  async getUserEmailBindings(userId, options = {}) {
    try {
      const { page = 1, pageSize = 5 } = options;

      const { count, rows } = await UserEmailBinding.findAndCountAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      return {
        bindings: rows,
        total: count,
        page,
        pageSize,
        totalPages: Math.ceil(count / pageSize)
      };
    } catch (error) {
      throw new Error(`获取邮箱绑定列表失败: ${error.message}`);
    }
  }

  // 获取单个邮箱绑定
  async getEmailBinding(bindingId, userId) {
    try {
      const binding = await UserEmailBinding.findOne({
        where: {
          id: bindingId,
          user_id: userId
        }
      });
      return binding;
    } catch (error) {
      throw new Error(`获取邮箱绑定失败: ${error.message}`);
    }
  }

  // 更新邮箱配置
  async updateEmailBinding(bindingId, updateData, userId) {
    try {
      const allowedFields = ['email_address', 'email_password', 'status'];
      const filteredData = {};
      
      // 只允许更新指定字段
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      // 如果要更新邮箱地址，检查是否与其他绑定冲突
      if (filteredData.email_address) {
        const existingBinding = await UserEmailBinding.findOne({
          where: {
            user_id: userId,
            email_address: filteredData.email_address,
            id: { [require('sequelize').Op.ne]: bindingId }
          }
        });

        if (existingBinding) {
          throw new Error('该邮箱地址已经被其他绑定使用了');
        }
      }

      const [updatedRowsCount] = await UserEmailBinding.update(filteredData, {
        where: {
          id: bindingId,
          user_id: userId
        }
      });

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getEmailBinding(bindingId, userId);
    } catch (error) {
      throw new Error(`更新邮箱绑定失败: ${error.message}`);
    }
  }

  // 删除邮箱绑定
  async deleteEmailBinding(bindingId, userId) {
    try {
      const deletedRowsCount = await UserEmailBinding.destroy({
        where: {
          id: bindingId,
          user_id: userId
        }
      });

      return deletedRowsCount > 0;
    } catch (error) {
      throw new Error(`删除邮箱绑定失败: ${error.message}`);
    }
  }

  // 启动/暂停邮箱绑定
  async setDefaultEmailBinding(bindingId, userId) {
    try {
      // 1. 先将该用户的所有邮箱设为非默认
      await UserEmailBinding.update(
        { is_default: false },
        { where: { user_id: userId } }
      );

      // 2. 将指定邮箱设为默认
      const [updatedRowsCount] = await UserEmailBinding.update(
        { is_default: true },
        {
          where: {
            id: bindingId,
            user_id: userId
          }
        }
      );

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getEmailBinding(bindingId, userId);
    } catch (error) {
      throw new Error(`设置默认邮箱失败: ${error.message}`);
    }
  }

  async toggleEmailBindingStatus(bindingId, status, userId) {
    try {
      if (!['active', 'inactive'].includes(status)) {
        throw new Error('无效的状态值，只支持 active 或 inactive');
      }

      const [updatedRowsCount] = await UserEmailBinding.update(
        { status: status },
        {
          where: {
            id: bindingId,
            user_id: userId
          }
        }
      );

      if (updatedRowsCount === 0) {
        return null;
      }

      return await this.getEmailBinding(bindingId, userId);
    } catch (error) {
      throw new Error(`更新邮箱绑定状态失败: ${error.message}`);
    }
  }

}

module.exports = UserEmailBindingService;
