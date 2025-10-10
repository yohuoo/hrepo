const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ContactService = require('../services/ContactService');

const contactService = new ContactService();

// 获取联系人列表
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      search = null,
      tags = null,
      startDate = null,
      endDate = null
    } = req.query;

    const options = {
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      search,
      startDate,
      endDate
    };

    // 处理标签参数
    if (tags) {
      options.tagNames = tags.split(',').map(tag => tag.trim());
    }

    const result = await contactService.getContacts(req.user.id, options);

    const contacts = result.contacts.map(contact => ({
      id: contact.id,
      user_id: contact.user_id,
      name: contact.name,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      company: contact.company,
      domain: contact.domain,
      position: contact.position,
      tags: contact.tags || [],
      description: contact.getDescription(),
      created_at: contact.created_at,
      updated_at: contact.updated_at
    }));

    res.json({
      success: true,
      contacts,
      total: result.total,
      page: result.page,
      page_size: result.pageSize,
      total_pages: result.totalPages
    });
  } catch (error) {
    console.error('获取联系人列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取联系人列表失败',
      error: error.message
    });
  }
});

// 创建联系人
router.post('/', authenticateToken, async (req, res) => {
  try {
    const contact = await contactService.createContact(req.body, req.user.id);
    
    res.status(201).json({
      success: true,
      contact: {
        id: contact.id,
        user_id: contact.user_id,
        name: contact.name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        domain: contact.domain,
        position: contact.position,
        tags: contact.tags || [],
        description: contact.getDescription(),
        created_at: contact.created_at,
        updated_at: contact.updated_at
      },
      message: '联系人创建成功'
    });
  } catch (error) {
    console.error('创建联系人错误:', error);
    res.status(500).json({
      success: false,
      message: '创建联系人失败',
      error: error.message
    });
  }
});

// 获取单个联系人
router.get('/:contactId', authenticateToken, async (req, res) => {
  try {
    const contact = await contactService.getContact(parseInt(req.params.contactId), req.user.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      });
    }

    res.json({
      success: true,
      contact: {
        id: contact.id,
        user_id: contact.user_id,
        name: contact.name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        domain: contact.domain,
        position: contact.position,
        tags: contact.tags || [],
        description: contact.getDescription(),
        created_at: contact.created_at,
        updated_at: contact.updated_at
      }
    });
  } catch (error) {
    console.error('获取联系人错误:', error);
    res.status(500).json({
      success: false,
      message: '获取联系人失败',
      error: error.message
    });
  }
});

// 更新联系人
router.put('/:contactId', authenticateToken, async (req, res) => {
  try {
    const contact = await contactService.updateContact(
      parseInt(req.params.contactId), 
      req.body, 
      req.user.id
    );
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      });
    }

    res.json({
      success: true,
      contact: {
        id: contact.id,
        user_id: contact.user_id,
        name: contact.name,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        domain: contact.domain,
        position: contact.position,
        tags: contact.tags || [],
        description: contact.getDescription(),
        created_at: contact.created_at,
        updated_at: contact.updated_at
      },
      message: '联系人更新成功'
    });
  } catch (error) {
    console.error('更新联系人错误:', error);
    res.status(500).json({
      success: false,
      message: '更新联系人失败',
      error: error.message
    });
  }
});

// 删除联系人
router.delete('/:contactId', authenticateToken, async (req, res) => {
  try {
    const success = await contactService.deleteContact(parseInt(req.params.contactId), req.user.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        message: '联系人不存在'
      });
    }

    res.json({
      success: true,
      message: '联系人删除成功'
    });
  } catch (error) {
    console.error('删除联系人错误:', error);
    res.status(500).json({
      success: false,
      message: '删除联系人失败',
      error: error.message
    });
  }
});

// 为联系人添加标签
router.post('/:contactId/tags', authenticateToken, async (req, res) => {
  try {
    const { tag_names } = req.body;
    
    if (!tag_names || !Array.isArray(tag_names)) {
      return res.status(400).json({
        success: false,
        message: '标签名称列表是必需的'
      });
    }

    const contact = await contactService.addTagsToContact(
      parseInt(req.params.contactId), 
      tag_names, 
      req.user.id
    );

    res.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        tags: contact.tags || []
      },
      message: '标签添加成功'
    });
  } catch (error) {
    console.error('添加标签错误:', error);
    res.status(500).json({
      success: false,
      message: '添加标签失败',
      error: error.message
    });
  }
});

// 从联系人移除标签
router.delete('/:contactId/tags/:tagName', authenticateToken, async (req, res) => {
  try {
    const contact = await contactService.removeTagsFromContact(
      parseInt(req.params.contactId), 
      [req.params.tagName], 
      req.user.id
    );

    res.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        tags: contact.tags || []
      },
      message: '标签移除成功'
    });
  } catch (error) {
    console.error('移除标签错误:', error);
    res.status(500).json({
      success: false,
      message: '移除标签失败',
      error: error.message
    });
  }
});

module.exports = router;
