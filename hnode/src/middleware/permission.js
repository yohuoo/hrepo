const PagePermissionService = require('../services/PagePermissionService');

const permissionService = new PagePermissionService();

/**
 * 检查页面访问权限中间件
 * @param {string} pageCode - 页面代码（如'customers.list', 'customers.delete'）
 */
function checkPagePermission(pageCode) {
  return async (req, res, next) => {
    try {
      const { id: userId, role: userRole, department_id: departmentId } = req.user;
      
      console.log(`🔒 检查权限: ${pageCode} - 用户${userId}, 角色${userRole}`);
      
      // 超级管理员跳过检查
      if (userRole === 'super_admin') {
        console.log('  ✅ 超级管理员，直接通过');
        return next();
      }
      
      // 检查权限
      const hasPermission = await permissionService.hasPermission(
        userId,
        departmentId,
        userRole,
        pageCode
      );
      
      if (hasPermission) {
        console.log('  ✅ 权限检查通过');
        return next();
      }
      
      console.log('  ❌ 权限不足');
      
      // 根据请求类型返回不同的响应
      // API请求返回JSON，页面请求返回HTML
      if (req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({
          success: false,
          message: '您没有访问此功能的权限',
          code: 'PERMISSION_DENIED'
        });
      } else {
        return res.status(403).render('errors/403', {
          message: '您没有访问此页面的权限',
          pageCode
        });
      }
    } catch (error) {
      console.error('❌ 权限检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '权限检查失败',
        error: error.message
      });
    }
  };
}

/**
 * 检查是否超级管理员
 */
function requireSuperAdmin(req, res, next) {
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(403).json({
      success: false,
      message: '只有超级管理员可以访问此功能'
    });
  } else {
    return res.status(403).render('errors/403', {
      message: '只有超级管理员可以访问此页面'
    });
  }
}

module.exports = {
  checkPagePermission,
  requireSuperAdmin
};

