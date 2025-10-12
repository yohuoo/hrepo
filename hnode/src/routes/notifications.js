const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const { authenticateToken } = require('../middleware/auth');

/**
 * 获取用户通知列表
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    
    const notifications = await NotificationService.getUserNotifications(userId, limit);
    
    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知列表失败'
    });
  }
});

/**
 * 获取用户通知计数
 * GET /api/notifications/count
 */
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await NotificationService.getNotificationCount(userId);
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('获取通知计数失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知计数失败'
    });
  }
});

/**
 * 标记通知为已读
 * POST /api/notifications/:notificationId/read
 */
router.post('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;
    
    const notification = await NotificationService.markAsRead(userId, notificationId);
    
    res.json({
      success: true,
      message: '通知已标记为已读',
      notification
    });
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '标记通知为已读失败'
    });
  }
});

/**
 * 标记所有通知为已读
 * POST /api/notifications/read-all
 */
router.post('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await NotificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      message: '所有通知已标记为已读'
    });
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    res.status(500).json({
      success: false,
      message: '标记所有通知为已读失败'
    });
  }
});

/**
 * 测试接口：添加邮件通知
 * POST /api/notifications/test/email
 */
router.post('/test/email', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { senderName, subject, emailId } = req.body;
    
    await NotificationService.addNotification(
      userId,
      'email',
      '新邮件',
      `${senderName || '未知用户'}向你发来了邮件`,
      {
        emailId: emailId || Math.floor(Math.random() * 1000),
        senderName: senderName || '张三',
        subject: subject || '关于项目讨论的邮件'
      }
    );
    
    res.json({
      success: true,
      message: '测试邮件通知已添加'
    });
  } catch (error) {
    console.error('添加测试邮件通知失败:', error);
    res.status(500).json({
      success: false,
      message: '添加测试邮件通知失败'
    });
  }
});

/**
 * 测试接口：添加会议记录通知
 * POST /api/notifications/test/meeting
 */
router.post('/test/meeting', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { meetingTitle, meetingId } = req.body;
    
    await NotificationService.addNotification(
      userId,
      'meeting',
      '会议记录',
      '视频会议记录处理完成',
      {
        meetingId: meetingId || Math.floor(Math.random() * 1000),
        meetingTitle: meetingTitle || '项目评审会议',
        duration: '1小时30分钟'
      }
    );
    
    res.json({
      success: true,
      message: '测试会议记录通知已添加'
    });
  } catch (error) {
    console.error('添加测试会议记录通知失败:', error);
    res.status(500).json({
      success: false,
      message: '添加测试会议记录通知失败'
    });
  }
});

module.exports = router;
