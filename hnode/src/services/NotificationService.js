const { redisClient } = require('../config/redis');

class NotificationService {
  /**
   * 检查Redis是否可用
   */
  isRedisAvailable() {
    return redisClient.status === 'ready' || redisClient.status === 'connecting';
  }
  /**
   * 添加通知
   * @param {number} userId - 用户ID
   * @param {string} type - 通知类型 (email, meeting)
   * @param {string} title - 通知标题
   * @param {string} message - 通知消息
   * @param {Object} data - 附加数据
   */
  async addNotification(userId, type, title, message, data = {}) {
    try {
      if (!this.isRedisAvailable()) {
        console.warn('⚠️  Redis不可用，跳过通知添加');
        return null;
      }
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const notification = {
        id: notificationId,
        type,
        title,
        message,
        data,
        createdAt: new Date().toISOString(),
        isRead: false
      };

      // 存储到Redis列表
      const listKey = `notifications:${userId}:list`;
      await redisClient.lpush(listKey, JSON.stringify(notification));
      
      // 更新计数
      const countKey = `notifications:${userId}:count`;
      await redisClient.incr(countKey);
      
      // 设置过期时间（7天）
      await redisClient.expire(listKey, 7 * 24 * 60 * 60);
      await redisClient.expire(countKey, 7 * 24 * 60 * 60);
      
      console.log(`✅ 通知已添加: ${userId} - ${type} - ${title}`);
      return notification;
    } catch (error) {
      console.error('❌ 添加通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有通知
   * @param {number} userId - 用户ID
   * @param {number} limit - 限制数量，默认20
   */
  async getUserNotifications(userId, limit = 20) {
    try {
      if (!this.isRedisAvailable()) {
        console.warn('⚠️  Redis不可用，返回空通知列表');
        return [];
      }
      const listKey = `notifications:${userId}:list`;
      const notifications = await redisClient.lrange(listKey, 0, limit - 1);
      
      return notifications.map(notification => {
        try {
          return JSON.parse(notification);
        } catch (error) {
          console.error('解析通知数据失败:', error);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('❌ 获取通知失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户通知计数
   * @param {number} userId - 用户ID
   */
  async getNotificationCount(userId) {
    try {
      if (!this.isRedisAvailable()) {
        console.warn('⚠️  Redis不可用，返回通知计数0');
        return 0;
      }
      const countKey = `notifications:${userId}:count`;
      const count = await redisClient.get(countKey);
      return parseInt(count) || 0;
    } catch (error) {
      console.error('❌ 获取通知计数失败:', error);
      return 0;
    }
  }

  /**
   * 标记通知为已读并删除
   * @param {number} userId - 用户ID
   * @param {string} notificationId - 通知ID
   */
  async markAsRead(userId, notificationId) {
    try {
      if (!this.isRedisAvailable()) {
        console.warn('⚠️  Redis不可用，跳过标记已读');
        return null;
      }
      const listKey = `notifications:${userId}:list`;
      const countKey = `notifications:${userId}:count`;
      
      // 获取所有通知
      const notifications = await redisClient.lrange(listKey, 0, -1);
      
      // 找到要删除的通知
      let targetIndex = -1;
      let targetNotification = null;
      
      for (let i = 0; i < notifications.length; i++) {
        const notification = JSON.parse(notifications[i]);
        if (notification.id === notificationId) {
          targetIndex = i;
          targetNotification = notification;
          break;
        }
      }
      
      if (targetIndex === -1) {
        throw new Error('通知不存在');
      }
      
      // 删除通知
      await redisClient.lrem(listKey, 1, notifications[targetIndex]);
      
      // 更新计数
      const currentCount = await redisClient.get(countKey);
      if (currentCount && parseInt(currentCount) > 0) {
        await redisClient.decr(countKey);
      }
      
      console.log(`✅ 通知已标记为已读: ${userId} - ${notificationId}`);
      return targetNotification;
    } catch (error) {
      console.error('❌ 标记通知为已读失败:', error);
      throw error;
    }
  }

  /**
   * 标记所有通知为已读
   * @param {number} userId - 用户ID
   */
  async markAllAsRead(userId) {
    try {
      if (!this.isRedisAvailable()) {
        console.warn('⚠️  Redis不可用，跳过标记所有已读');
        return false;
      }
      const listKey = `notifications:${userId}:list`;
      const countKey = `notifications:${userId}:count`;
      
      // 清空通知列表
      await redisClient.del(listKey);
      
      // 重置计数
      await redisClient.set(countKey, 0);
      
      console.log(`✅ 所有通知已标记为已读: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ 标记所有通知为已读失败:', error);
      throw error;
    }
  }

  /**
   * 清理过期通知
   * @param {number} userId - 用户ID
   */
  async cleanExpiredNotifications(userId) {
    try {
      // Redis会自动处理过期，这里可以添加额外的清理逻辑
      console.log(`🧹 清理过期通知: ${userId}`);
      return true;
    } catch (error) {
      console.error('❌ 清理过期通知失败:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
