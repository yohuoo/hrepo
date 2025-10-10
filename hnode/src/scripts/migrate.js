const { sequelize, testConnection } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔍 开始数据库迁移...');

    // 测试数据库连接
    await testConnection();
    console.log('✅ 数据库连接成功');

    // 读取并执行init.sql
    const initSqlPath = path.join(__dirname, '../../migrations/init.sql');
    
    if (fs.existsSync(initSqlPath)) {
      console.log('📄 执行初始化SQL脚本...');
      const initSql = fs.readFileSync(initSqlPath, 'utf-8');
      
      // 执行SQL
      await sequelize.query(initSql);
      console.log('✅ 初始化SQL执行成功');
    } else {
      console.log('⚠️  未找到init.sql文件，跳过');
    }

    // 同步模型（不强制重建表）
    console.log('🔄 同步数据库模型...');
    await sequelize.sync({ alter: false, force: false });
    console.log('✅ 数据库模型同步成功');

    console.log('🎉 数据库迁移完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  }
}

// 执行迁移
runMigrations();
