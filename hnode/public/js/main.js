// ==================== Toast通知系统 ====================
let toastCounter = 0;

/**
 * 显示Toast通知
 * @param {string} message - 消息内容
 * @param {string} type - 类型: 'success', 'error', 'warning', 'info'
 * @param {number} duration - 显示时长（毫秒），默认3000ms
 */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) {
    console.error('Toast容器不存在');
    return;
  }

  const toastId = `toast-${++toastCounter}`;
  
  // 图标映射
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  // 标题映射
  const titles = {
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '提示'
  };
  
  const icon = icons[type] || icons.info;
  const title = titles[type] || titles.info;
  
  // 创建Toast元素
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast-notification toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <div class="toast-close" onclick="closeToast('${toastId}')">×</div>
  `;
  
  // 添加到容器
  container.appendChild(toast);
  
  // 点击Toast关闭
  toast.addEventListener('click', (e) => {
    if (!e.target.classList.contains('toast-close')) {
      closeToast(toastId);
    }
  });
  
  // 自动关闭
  if (duration > 0) {
    setTimeout(() => {
      closeToast(toastId);
    }, duration);
  }
}

/**
 * 关闭Toast通知
 * @param {string} toastId - Toast ID
 */
function closeToast(toastId) {
  const toast = document.getElementById(toastId);
  if (toast) {
    toast.classList.add('hiding');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

/**
 * 快捷方法
 */
function showSuccess(message, duration = 3000) {
  showToast(message, 'success', duration);
}

function showError(message, duration = 4000) {
  showToast(message, 'error', duration);
}

function showWarning(message, duration = 3500) {
  showToast(message, 'warning', duration);
}

function showInfo(message, duration = 3000) {
  showToast(message, 'info', duration);
}

// ==================== 全局配置 ====================
const API_BASE_URL = '/api';  // 使用相对路径，避免跨域问题
let authToken = localStorage.getItem('authToken');

// Axios默认配置 - 不设置baseURL，避免URL重复
// axios.defaults.baseURL = API_BASE_URL;  // 注释掉，防止URL重复
if (authToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
}

// ==================== 认证相关 ====================
function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
  delete axios.defaults.headers.common['Authorization'];
}

function checkAuth() {
  if (!authToken) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// ==================== 登录 ====================
async function login(username, password) {
  try {
    const response = await axios.post('/api/auth/login', {
      username,
      password
    });
    
    if (response.data.success) {
      setAuthToken(response.data.token);
      // 设置cookie
      document.cookie = `authToken=${response.data.token}; path=/; max-age=${7*24*60*60}`;
      showToast('登录成功', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    }
  } catch (error) {
    console.error('登录错误:', error);
    showToast(error.response?.data?.message || '登录失败', 'danger');
  }
}

// ==================== 注册 ====================
async function register(username, email, password) {
  try {
    const response = await axios.post('/api/auth/register', {
      username,
      email,
      password
    });
    
    if (response.data.success) {
      setAuthToken(response.data.token);
      // 设置cookie
      document.cookie = `authToken=${response.data.token}; path=/; max-age=${7*24*60*60}`;
      showToast('注册成功', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    }
  } catch (error) {
    console.error('注册错误:', error);
    showToast(error.response?.data?.message || '注册失败', 'danger');
  }
}

// ==================== 登出 ====================
async function logout() {
  try {
    await axios.post('/api/auth/logout');
    clearAuthToken();
    // 清除cookie
    document.cookie = 'authToken=; path=/; max-age=0';
    showToast('已退出登录', 'success');
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  } catch (error) {
    clearAuthToken();
    document.cookie = 'authToken=; path=/; max-age=0';
    window.location.href = '/login';
  }
}

// ==================== Toast提示 ====================
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();
  
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  toastContainer.appendChild(toastEl);
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
  
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

// ==================== Loading ====================
function showLoading() {
  const loadingHTML = `
    <div class="loading-overlay" id="loadingOverlay">
      <div class="spinner-border spinner-border-lg text-primary" role="status">
        <span class="visually-hidden">加载中...</span>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', loadingHTML);
}

function hideLoading() {
  const loading = document.getElementById('loadingOverlay');
  if (loading) {
    loading.remove();
  }
}

// ==================== 格式化日期 ====================
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // 1分钟内
  if (diff < 60000) {
    return '刚刚';
  }
  // 1小时内
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  // 其他
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// ==================== 格式化文件大小 ====================
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// ==================== 防抖函数 ====================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ==================== 侧边栏切换（移动端） ====================
$(document).ready(function() {
  $('#sidebarToggle').on('click', function() {
    $('.sidebar').toggleClass('show');
  });
  
  // 点击内容区关闭侧边栏
  $('.main-content').on('click', function() {
    if ($(window).width() < 992) {
      $('.sidebar').removeClass('show');
    }
  });
});

// ==================== Axios拦截器 ====================
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      showToast('登录已过期，请重新登录', 'warning');
      clearAuthToken();
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    }
    return Promise.reject(error);
  }
);

// ==================== 确认对话框 ====================
function confirmDialog(message, callback) {
  if (confirm(message)) {
    callback();
  }
}

// ==================== 显示个人信息 ====================
function showUserProfile() {
  const modal = new bootstrap.Modal(document.getElementById('userProfileModal'));
  modal.show();
}
