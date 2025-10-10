const { sequelize, testConnection } = require('../config/database');

// 导入所有模型
const User = require('./User');
const Contact = require('./Contact');
const ContactTag = require('./ContactTag');
const Customer = require('./Customer');
const EmailTemplate = require('./EmailTemplate');
const UserEmailBinding = require('./UserEmailBinding');
const EmailHistory = require('./EmailHistory');
const ZoomMeeting = require('./ZoomMeeting');
const CustomerAnalysis = require('./CustomerAnalysis');

// 定义模型关联
const setupAssociations = () => {
  // User关联
  User.hasMany(Contact, { foreignKey: 'user_id', as: 'contacts' });
  User.hasMany(ContactTag, { foreignKey: 'user_id', as: 'contactTags' });
  User.hasMany(Customer, { foreignKey: 'user_id', as: 'customers' });
  User.hasMany(EmailTemplate, { foreignKey: 'user_id', as: 'emailTemplates' });
  User.hasMany(UserEmailBinding, { foreignKey: 'user_id', as: 'emailBindings' });
  User.hasMany(EmailHistory, { foreignKey: 'user_id', as: 'emailHistory' });
  User.hasMany(ZoomMeeting, { foreignKey: 'user_id', as: 'zoomMeetings' });
  User.hasMany(CustomerAnalysis, { foreignKey: 'user_id', as: 'customerAnalyses' });

  // Contact关联
  Contact.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ContactTag关联
  ContactTag.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // Customer关联
  Customer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // EmailTemplate关联
  EmailTemplate.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // UserEmailBinding关联
  UserEmailBinding.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // EmailHistory关联
  EmailHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  EmailHistory.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  EmailHistory.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
  EmailHistory.belongsTo(UserEmailBinding, { foreignKey: 'sender_email_binding_id', as: 'senderEmailBinding' });
  
  Customer.hasMany(EmailHistory, { foreignKey: 'customer_id', as: 'emailHistory' });
  Contact.hasMany(EmailHistory, { foreignKey: 'contact_id', as: 'emailHistory' });
  UserEmailBinding.hasMany(EmailHistory, { foreignKey: 'sender_email_binding_id', as: 'sentEmails' });

  // ZoomMeeting关联
  ZoomMeeting.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  ZoomMeeting.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  
  Customer.hasMany(ZoomMeeting, { foreignKey: 'customer_id', as: 'zoomMeetings' });

  // CustomerAnalysis关联
  CustomerAnalysis.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  CustomerAnalysis.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  
  Customer.hasMany(CustomerAnalysis, { foreignKey: 'customer_id', as: 'analyses' });
};

// 初始化数据库
const initializeDatabase = async () => {
  try {
    // 设置关联
    setupAssociations();
    
    // 同步数据库 - 使用force: false避免数据丢失
    await sequelize.sync({ force: false });
    console.log('✅ 数据库模型同步成功');
  } catch (error) {
    console.error('❌ 数据库模型同步失败:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
  User,
  Contact,
  ContactTag,
  Customer,
  EmailTemplate,
  UserEmailBinding,
  EmailHistory,
  ZoomMeeting,
  CustomerAnalysis,
  setupAssociations,
  initializeDatabase
};
