// ==================== 通知系统 ====================

let notificationPollingInterval = null;
let isNotificationDropdownOpen = false;

/**
 * 初始化通知系统
 */
function initNotificationSystem() {
  console.log('🔔 初始化通知系统');
  
  // 加载初始通知
  fetchNotifications();
  
  // 开始轮询
  startNotificationPolling();
  
  // 页面可见性变化时重新开始轮询
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopNotificationPolling();
    } else {
      startNotificationPolling();
    }
  });
}

/**
 * 开始轮询通知
 */
function startNotificationPolling() {
  if (notificationPollingInterval) {
    clearInterval(notificationPollingInterval);
  }
  
  // 每5秒检查一次通知（同时更新计数和列表）
  notificationPollingInterval = setInterval(() => {
    if (!document.hidden) {
      fetchNotifications(); // 同时更新计数和列表
    }
  }, 5000);
  
  console.log('🔄 通知轮询已开始（每5秒）');
}

/**
 * 停止轮询通知
 */
function stopNotificationPolling() {
  if (notificationPollingInterval) {
    clearInterval(notificationPollingInterval);
    notificationPollingInterval = null;
  }
  console.log('⏸️ 通知轮询已停止');
}

/**
 * 获取通知列表
 */
async function fetchNotifications() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取通知失败');
    }
    
    const data = await response.json();
    
    if (data.success) {
      updateNotificationList(data.notifications);
      updateNotificationCount(data.count);
    }
  } catch (error) {
    console.error('获取通知失败:', error);
  }
}

/**
 * 获取通知计数
 */
async function fetchNotificationCount() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/notifications/count', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('获取通知计数失败');
    }
    
    const data = await response.json();
    
    if (data.success) {
      updateNotificationCount(data.count);
    }
  } catch (error) {
    console.error('获取通知计数失败:', error);
  }
}

/**
 * 更新通知列表显示
 */
function updateNotificationList(notifications) {
  const notificationList = document.getElementById('notificationList');
  
  if (!notifications || notifications.length === 0) {
    notificationList.innerHTML = `
      <li class="dropdown-item-text text-center text-muted py-3">
        <i class="bi bi-bell-slash fs-4 d-block mb-2"></i>
        暂无新通知
      </li>
    `;
    return;
  }
  
  const notificationsHTML = notifications.map(notification => {
    const timeAgo = getTimeAgo(notification.createdAt);
    const iconClass = getNotificationIcon(notification.type);
    
    return `
      <li class="notification-item" onclick="handleNotificationClick('${notification.id}', '${notification.type}', ${JSON.stringify(notification.data).replace(/"/g, '&quot;')}); return false;">
        <div class="d-flex align-items-start p-2">
          <div class="me-3">
            <i class="${iconClass} fs-5 text-primary"></i>
          </div>
          <div class="flex-grow-1">
            <div class="fw-bold text-dark">${notification.title}</div>
            <div class="text-muted small">${notification.message}</div>
            <div class="text-muted" style="font-size: 0.75rem;">${timeAgo}</div>
          </div>
        </div>
      </li>
    `;
  }).join('');
  
  notificationList.innerHTML = notificationsHTML;
}

/**
 * 更新通知计数显示
 */
function updateNotificationCount(count) {
  const notificationCount = document.getElementById('notificationCount');
  
  if (count > 0) {
    notificationCount.textContent = count > 99 ? '99+' : count;
    notificationCount.style.display = 'block';
  } else {
    notificationCount.style.display = 'none';
  }
}

/**
 * 获取通知图标
 */
function getNotificationIcon(type) {
  switch (type) {
    case 'email':
      return 'bi bi-envelope';
    case 'meeting':
      return 'bi bi-camera-video';
    default:
      return 'bi bi-bell';
  }
}

/**
 * 获取时间差显示
 */
function getTimeAgo(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffInSeconds = Math.floor((now - created) / 1000);
  
  if (diffInSeconds < 60) {
    return '刚刚';
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}分钟前`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}小时前`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  }
}

/**
 * 处理通知点击
 */
async function handleNotificationClick(notificationId, type, data) {
  try {
    // 标记为已读
    await markNotificationAsRead(notificationId);
    
    // 根据类型跳转到对应页面
    switch (type) {
      case 'email':
        // 跳转到邮件页面，并高亮显示对应邮件
        window.location.href = '/emails/inbox';
        break;
      case 'meeting':
        // 跳转到会议记录页面，并高亮显示对应记录
        window.location.href = '/meetings';
        break;
      default:
        console.log('未知的通知类型:', type);
    }
    
    // 关闭下拉菜单
    closeNotificationDropdown();
    
  } catch (error) {
    console.error('处理通知点击失败:', error);
    showError('处理通知失败');
  }
}

/**
 * 标记通知为已读
 */
async function markNotificationAsRead(notificationId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('标记通知为已读失败');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // 重新加载通知列表
      await fetchNotifications();
    }
  } catch (error) {
    console.error('标记通知为已读失败:', error);
    throw error;
  }
}

/**
 * 标记所有通知为已读
 */
async function markAllAsRead() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('标记所有通知为已读失败');
    }
    
    const data = await response.json();
    
    if (data.success) {
      // 重新加载通知列表
      await fetchNotifications();
      showSuccess('所有通知已标记为已读');
    }
  } catch (error) {
    console.error('标记所有通知为已读失败:', error);
    showError('标记所有通知为已读失败');
  }
}

/**
 * 切换通知下拉菜单
 */
function toggleNotifications() {
  if (isNotificationDropdownOpen) {
    closeNotificationDropdown();
  } else {
    openNotificationDropdown();
  }
}

/**
 * 打开通知下拉菜单
 */
function openNotificationDropdown() {
  isNotificationDropdownOpen = true;
  // 立即刷新通知列表
  fetchNotifications();
  console.log('📋 打开通知下拉菜单，刷新通知列表');
}

/**
 * 关闭通知下拉菜单
 */
function closeNotificationDropdown() {
  isNotificationDropdownOpen = false;
  // Bootstrap会自动处理下拉菜单的隐藏
  console.log('📋 关闭通知下拉菜单');
}

/**
 * 添加测试通知（开发用）
 */
async function addTestNotification(type = 'email') {
  try {
    const token = localStorage.getItem('authToken');
    
    const endpoint = type === 'email' ? '/api/notifications/test/email' : '/api/notifications/test/meeting';
    const body = type === 'email' 
      ? { senderName: '测试用户', subject: '测试邮件', emailId: 999 }
      : { meetingTitle: '测试会议', meetingId: 888 };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error('添加测试通知失败');
    }
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess(data.message);
      // 重新加载通知
      await fetchNotifications();
    }
  } catch (error) {
    console.error('添加测试通知失败:', error);
    showError('添加测试通知失败');
  }
}

// 页面加载完成后初始化通知系统
document.addEventListener('DOMContentLoaded', function() {
  // 延迟初始化，确保其他组件已加载
  setTimeout(initNotificationSystem, 1000);
  
  // 监听Bootstrap dropdown事件
  const notificationContainer = document.getElementById('notificationContainer');
  if (notificationContainer) {
    notificationContainer.addEventListener('show.bs.dropdown', function () {
      console.log('📋 通知下拉菜单即将打开');
      openNotificationDropdown();
    });
    
    notificationContainer.addEventListener('hide.bs.dropdown', function () {
      console.log('📋 通知下拉菜单即将关闭');
      closeNotificationDropdown();
    });
  }
});

// 暴露全局函数供测试使用
window.addTestNotification = addTestNotification;
window.markAllAsRead = markAllAsRead;
