const { sequelize, testConnection } = require('../config/database');

// 导入所有模型
const User = require('./User');
const Department = require('./Department');
const Contact = require('./Contact');
const ContactTag = require('./ContactTag');
const Customer = require('./Customer');
const EmailTemplate = require('./EmailTemplate');
const UserEmailBinding = require('./UserEmailBinding');
const EmailHistory = require('./EmailHistory');
const ZoomMeeting = require('./ZoomMeeting');
const CustomerAnalysis = require('./CustomerAnalysis');
const SalesRecord = require('./SalesRecord');
const Contract = require('./Contract');
const CaseStudy = require('./CaseStudy');
const Report = require('./Report');
const Page = require('./Page');
const PagePermission = require('./PagePermission');
const PermissionAuditLog = require('./PermissionAuditLog');

// 定义模型关联
const setupAssociations = () => {
  // Department关联
  Department.belongsTo(Department, { foreignKey: 'parent_id', as: 'parent' });
  Department.hasMany(Department, { foreignKey: 'parent_id', as: 'children' });
  Department.hasMany(User, { foreignKey: 'department_id', as: 'members' });
  Department.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
  
  // User关联
  User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
  User.hasMany(Contact, { foreignKey: 'user_id', as: 'contacts' });
  User.hasMany(ContactTag, { foreignKey: 'user_id', as: 'contactTags' });
  User.hasMany(Customer, { foreignKey: 'user_id', as: 'customers' });
  User.hasMany(EmailTemplate, { foreignKey: 'user_id', as: 'emailTemplates' });
  User.hasMany(UserEmailBinding, { foreignKey: 'user_id', as: 'emailBindings' });
  User.hasMany(EmailHistory, { foreignKey: 'user_id', as: 'emailHistory' });
  User.hasMany(ZoomMeeting, { foreignKey: 'user_id', as: 'zoomMeetings' });
  User.hasMany(CustomerAnalysis, { foreignKey: 'user_id', as: 'customerAnalyses' });
  User.hasMany(SalesRecord, { foreignKey: 'user_id', as: 'salesRecords' });
  User.hasMany(Report, { foreignKey: 'user_id', as: 'reports' });
  User.hasMany(Report, { foreignKey: 'generated_by', as: 'generatedReports' });

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
  
  // SalesRecord关联
  SalesRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  SalesRecord.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  
  Customer.hasMany(SalesRecord, { foreignKey: 'customer_id', as: 'salesRecords' });
  
  // Contract关联
  Contract.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Contract.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  
  Customer.hasMany(Contract, { foreignKey: 'customer_id', as: 'contracts' });
  User.hasMany(Contract, { foreignKey: 'user_id', as: 'contracts' });
  
  // CaseStudy关联
  CaseStudy.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  CaseStudy.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
  CaseStudy.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });
  
  Customer.hasMany(CaseStudy, { foreignKey: 'customer_id', as: 'caseStudies' });
  User.hasMany(CaseStudy, { foreignKey: 'user_id', as: 'caseStudies' });
  User.hasMany(CaseStudy, { foreignKey: 'generated_by', as: 'generatedCaseStudies' });
  
  // Report关联
  Report.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Report.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
  Report.belongsTo(User, { foreignKey: 'generated_by', as: 'generator' });
  
  Department.hasMany(Report, { foreignKey: 'department_id', as: 'reports' });
  
  // Page关联（自关联）
  Page.belongsTo(Page, { foreignKey: 'parent_id', as: 'parent' });
  Page.hasMany(Page, { foreignKey: 'parent_id', as: 'children' });
  
  // PagePermission关联
  PagePermission.belongsTo(Page, { foreignKey: 'page_id', as: 'page' });
  PagePermission.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  
  Page.hasMany(PagePermission, { foreignKey: 'page_id', as: 'permissions' });
  
  // PermissionAuditLog关联
  PermissionAuditLog.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });
  
  User.hasMany(PermissionAuditLog, { foreignKey: 'operator_id', as: 'auditLogs' });
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
  Department,
  Contact,
  ContactTag,
  Customer,
  EmailTemplate,
  UserEmailBinding,
  EmailHistory,
  ZoomMeeting,
  CustomerAnalysis,
  SalesRecord,
  Contract,
  CaseStudy,
  Report,
  Page,
  PagePermission,
  PermissionAuditLog,
  setupAssociations,
  initializeDatabase
};
