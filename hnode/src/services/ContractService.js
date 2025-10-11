const { Contract, Customer, EmailHistory, SalesRecord, User } = require('../models');
const { Op } = require('sequelize');

class ContractService {
  /**
   * 创建合同
   */
  async createContract(userId, contractData) {
    const { customer_id, contract_number, party_a_name, party_b_name, purchase_product, purchase_quantity, 
            estimated_delivery_date, contract_amount, currency, notes, ai_generated } = contractData;
    
    // 验证客户是否存在
    const customer = await Customer.findOne({
      where: { id: customer_id }
    });
    
    if (!customer) {
      throw new Error('客户不存在');
    }
    
    // 创建合同
    const contract = await Contract.create({
      customer_id,
      user_id: userId,
      contract_number,
      party_a_name,
      party_b_name: party_b_name || '浩天药业有限公司',
      purchase_product,
      purchase_quantity,
      estimated_delivery_date,
      contract_amount,
      currency: currency || 'USD',
      notes,
      ai_generated: ai_generated || false
    });
    
    console.log('✅ 合同创建成功，ID:', contract.id);
    
    // 自动将客户标记为已成交
    console.log('🔍 检查客户成交状态，当前状态:', customer.deal_status);
    if (customer.deal_status !== '已成交') {
      await customer.update({ deal_status: '已成交' });
      console.log('✅ 客户已自动标记为已成交，客户ID:', customer_id, '新状态: 已成交');
    } else {
      console.log('ℹ️ 客户已经是已成交状态，无需更新');
    }
    
    // 自动创建销售记录
    try {
      const today = new Date();
      const saleDate = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
      
      const salesRecord = await SalesRecord.create({
        user_id: userId,
        customer_id: customer_id,
        sale_date: saleDate, // 使用当前日期，而非预计交付时间
        product_name: purchase_product || '未指定产品',
        quantity: purchase_quantity || 0,
        amount: contract_amount || 0,
        currency: currency || 'USD',
        notes: `关联合同: ${contract_number || contract.id}, 甲方: ${party_a_name}, 乙方: ${party_b_name || '浩天药业有限公司'}${estimated_delivery_date ? ', 预计交付: ' + estimated_delivery_date : ''}`
      });
      console.log('✅ 销售记录自动创建成功，ID:', salesRecord.id, '销售日期:', saleDate);
    } catch (salesError) {
      console.error('⚠️ 创建销售记录失败:', salesError.message);
      // 不影响合同创建流程，只记录错误
    }
    
    return contract;
  }

  /**
   * 获取客户的所有合同
   */
  async getCustomerContracts(customerId, userId, userRole) {
    const whereClause = { customer_id: customerId };
    
    // 权限检查：普通用户只能看自己的合同
    if (userRole === 'user') {
      whereClause.user_id = userId;
    }
    
    const contracts = await Contract.findAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'company', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    return contracts;
  }

  /**
   * 获取合同详情
   */
  async getContractById(contractId, userId, userRole) {
    const contract = await Contract.findByPk(contractId, {
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'company', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        }
      ]
    });
    
    if (!contract) {
      throw new Error('合同不存在');
    }
    
    // 权限检查
    if (userRole === 'user' && contract.user_id !== userId) {
      throw new Error('权限不足');
    }
    
    return contract;
  }

  /**
   * 更新合同
   */
  async updateContract(contractId, userId, userRole, contractData) {
    const contract = await Contract.findByPk(contractId);
    
    if (!contract) {
      throw new Error('合同不存在');
    }
    
    // 权限检查
    if (userRole === 'user' && contract.user_id !== userId) {
      throw new Error('权限不足');
    }
    
    await contract.update(contractData);
    
    console.log('✅ 合同更新成功，ID:', contractId);
    
    return contract;
  }

  /**
   * 删除合同
   */
  async deleteContract(contractId, userId, userRole) {
    const contract = await Contract.findByPk(contractId);
    
    if (!contract) {
      throw new Error('合同不存在');
    }
    
    // 权限检查
    if (userRole === 'user' && contract.user_id !== userId) {
      throw new Error('权限不足');
    }
    
    await contract.destroy();
    
    console.log('✅ 合同删除成功，ID:', contractId);
    
    return true;
  }

  /**
   * AI建议合同信息
   * 基于客户的邮件往来和销售记录生成合同建议
   */
  async suggestContractInfo(customerId, userId) {
    console.log('🤖 开始生成合同建议，客户ID:', customerId);
    
    // 获取客户信息
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      throw new Error('客户不存在');
    }
    
    // 获取客户的邮件往来（最近10封）
    const emails = await EmailHistory.findAll({
      where: { customer_id: customerId },
      order: [['send_time', 'DESC']],
      limit: 10,
      attributes: ['title', 'content', 'email_type', 'send_time']
    });
    
    // 获取客户的销售记录
    const salesRecords = await SalesRecord.findAll({
      where: { customer_id: customerId },
      order: [['sale_date', 'DESC']],
      limit: 5,
      attributes: ['product_name', 'quantity', 'amount', 'currency', 'sale_date']
    });
    
    console.log('📧 邮件数量:', emails.length);
    console.log('💰 销售记录数量:', salesRecords.length);
    
    // 构建上下文数据
    const context = {
      customer: {
        name: customer.name,
        company: customer.company,
        email: customer.email
      },
      emails: emails.map(e => ({
        title: e.title,
        content: e.content ? e.content.substring(0, 500) : '',
        type: e.email_type,
        date: e.send_time
      })),
      sales: salesRecords.map(s => ({
        product: s.product_name,
        quantity: s.quantity,
        amount: s.amount,
        currency: s.currency,
        date: s.sale_date
      }))
    };
    
    return context;
  }
}

module.exports = ContractService;

