const express = require('express');
const router = express.Router();
const { EmailDraft, UserEmailBinding, EmailTemplate } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// 获取草稿列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, is_auto_save } = req.query;
    
    const offset = (page - 1) * pageSize;
    
    const where = { user_id: userId };
    
    // 筛选：只看手动保存的草稿或只看自动保存的草稿
    if (is_auto_save !== undefined) {
      where.is_auto_save = is_auto_save === 'true';
    }
    
    const { count, rows: drafts } = await EmailDraft.findAndCountAll({
      where,
      include: [
        {
          model: UserEmailBinding,
          as: 'senderEmailBinding',
          attributes: ['id', 'email_address']
        },
        {
          model: EmailTemplate,
          as: 'template',
          attributes: ['id', 'title']
        }
      ],
      order: [['updated_at', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });
    
    res.json({
      success: true,
      drafts,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(count / pageSize)
      }
    });
  } catch (error) {
    console.error('获取草稿列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取草稿列表失败: ' + error.message
    });
  }
});

// 获取单个草稿
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const draftId = req.params.id;
    
    const draft = await EmailDraft.findOne({
      where: {
        id: draftId,
        user_id: userId
      },
      include: [
        {
          model: UserEmailBinding,
          as: 'senderEmailBinding',
          attributes: ['id', 'email_address']
        },
        {
          model: EmailTemplate,
          as: 'template',
          attributes: ['id', 'title', 'content']
        }
      ]
    });
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在或无权访问'
      });
    }
    
    res.json({
      success: true,
      draft
    });
  } catch (error) {
    console.error('获取草稿失败:', error);
    res.status(500).json({
      success: false,
      message: '获取草稿失败: ' + error.message
    });
  }
});

// 创建或更新草稿
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      id, // 如果提供id，则更新；否则创建
      sender_email_binding_id,
      recipients,
      title,
      content,
      template_id,
      draft_name,
      is_auto_save = false
    } = req.body;
    
    let draft;
    
    if (id) {
      // 更新现有草稿
      draft = await EmailDraft.findOne({
        where: {
          id,
          user_id: userId
        }
      });
      
      if (!draft) {
        return res.status(404).json({
          success: false,
          message: '草稿不存在或无权访问'
        });
      }
      
      await draft.update({
        sender_email_binding_id,
        recipients,
        title,
        content,
        template_id,
        draft_name,
        is_auto_save
      });
      
      console.log('✅ 草稿已更新:', draft.id);
    } else {
      // 创建新草稿
      draft = await EmailDraft.create({
        user_id: userId,
        sender_email_binding_id,
        recipients,
        title,
        content,
        template_id,
        draft_name,
        is_auto_save
      });
      
      console.log('✅ 草稿已创建:', draft.id);
    }
    
    // 重新查询带关联的完整数据
    const fullDraft = await EmailDraft.findOne({
      where: { id: draft.id },
      include: [
        {
          model: UserEmailBinding,
          as: 'senderEmailBinding',
          attributes: ['id', 'email_address']
        },
        {
          model: EmailTemplate,
          as: 'template',
          attributes: ['id', 'title']
        }
      ]
    });
    
    res.json({
      success: true,
      message: id ? '草稿已更新' : '草稿已保存',
      draft: fullDraft
    });
  } catch (error) {
    console.error('保存草稿失败:', error);
    res.status(500).json({
      success: false,
      message: '保存草稿失败: ' + error.message
    });
  }
});

// 删除草稿
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const draftId = req.params.id;
    
    const draft = await EmailDraft.findOne({
      where: {
        id: draftId,
        user_id: userId
      }
    });
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在或无权访问'
      });
    }
    
    await draft.destroy();
    
    console.log('✅ 草稿已删除:', draftId);
    
    res.json({
      success: true,
      message: '草稿已删除'
    });
  } catch (error) {
    console.error('删除草稿失败:', error);
    res.status(500).json({
      success: false,
      message: '删除草稿失败: ' + error.message
    });
  }
});

// 批量删除草稿
router.post('/batch-delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { draft_ids } = req.body;
    
    if (!Array.isArray(draft_ids) || draft_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要删除的草稿ID列表'
      });
    }
    
    const deleted = await EmailDraft.destroy({
      where: {
        id: draft_ids,
        user_id: userId
      }
    });
    
    console.log('✅ 批量删除草稿:', deleted, '个');
    
    res.json({
      success: true,
      message: `成功删除${deleted}个草稿`,
      deleted_count: deleted
    });
  } catch (error) {
    console.error('批量删除草稿失败:', error);
    res.status(500).json({
      success: false,
      message: '批量删除草稿失败: ' + error.message
    });
  }
});

module.exports = router;

