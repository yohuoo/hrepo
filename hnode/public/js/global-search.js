// 全局搜索配置 - 页面和功能映射
const SEARCH_INDEX = [
  // ==================== 首页/控制台 ====================
  {
    title: '控制台',
    keywords: ['控制台', '首页', 'dashboard', '主页'],
    url: '/dashboard',
    icon: 'bi-speedometer2',
    category: '主要'
  },
  {
    title: '海外客户搜索',
    keywords: ['海外', 'overseas', '搜索客户', 'AI搜索', '潜在客户'],
    url: '/dashboard',
    icon: 'bi-globe',
    category: '主要'
  },
  
  // ==================== 联系人管理 ====================
  {
    title: '联系人管理',
    keywords: ['联系人', 'contacts', '联系人列表', '管理联系人'],
    url: '/contacts',
    icon: 'bi-person-lines-fill',
    category: '客户管理'
  },
  {
    title: '添加联系人',
    keywords: ['添加联系人', '新增联系人', '创建联系人', 'add contact'],
    url: '/contacts',
    icon: 'bi-person-plus',
    category: '客户管理',
    action: '点击页面上的"添加联系人"按钮'
  },
  {
    title: 'Hunter.io搜索',
    keywords: ['hunter', 'hunter.io', '域名搜索', '搜索邮箱'],
    url: '/contacts',
    icon: 'bi-search',
    category: '客户管理',
    action: '点击"Hunter.io搜索"按钮'
  },
  
  // ==================== 客户管理 ====================
  {
    title: '客户管理',
    keywords: ['客户', 'customers', '客户列表', '管理客户'],
    url: '/customers',
    icon: 'bi-people',
    category: '客户管理'
  },
  {
    title: '添加客户',
    keywords: ['添加客户', '新增客户', '创建客户'],
    url: '/customers',
    icon: 'bi-person-plus-fill',
    category: '客户管理',
    action: '点击"新增客户"按钮'
  },
  {
    title: '合同管理',
    keywords: ['合同', 'contract', '录入合同', '合同列表'],
    url: '/customers',
    icon: 'bi-file-earmark-text',
    category: '客户管理',
    action: '在客户列表中点击"录入合同"或"合同列表"'
  },
  
  // ==================== 邮件功能 ====================
  {
    title: '收件箱',
    keywords: ['收件箱', 'inbox', '收到的邮件', '邮件', '查看邮件'],
    url: '/emails/inbox',
    icon: 'bi-inbox',
    category: '邮件'
  },
  {
    title: '发件箱',
    keywords: ['发件箱', 'sent', '已发送', '发送的邮件'],
    url: '/emails/sent',
    icon: 'bi-send',
    category: '邮件'
  },
  {
    title: '写邮件',
    keywords: ['写邮件', 'compose', '发邮件', '发送邮件', '新邮件'],
    url: '/emails/compose',
    icon: 'bi-pencil-square',
    category: '邮件'
  },
  {
    title: '邮件模板',
    keywords: ['邮件模板', 'template', '模板', 'email template'],
    url: '/emails/templates',
    icon: 'bi-file-earmark-text',
    category: '邮件'
  },
  
  // ==================== 会议记录 ====================
  {
    title: '会议记录',
    keywords: ['会议', 'meeting', '视频会议', 'zoom', '会议记录'],
    url: '/meetings',
    icon: 'bi-camera-video',
    category: '沟通'
  },
  {
    title: '上传视频',
    keywords: ['上传视频', '上传会议', '视频上传'],
    url: '/meetings',
    icon: 'bi-upload',
    category: '沟通',
    action: '点击"上传视频"按钮'
  },
  
  // ==================== 销售数据 ====================
  {
    title: '销售数据',
    keywords: ['销售', 'sales', '销售记录', '业绩'],
    url: '/sales',
    icon: 'bi-graph-up',
    category: '数据分析'
  },
  
  // ==================== 数据统计 ====================
  {
    title: '数据统计',
    keywords: ['统计', 'statistics', '数据分析', '图表'],
    url: '/statistics',
    icon: 'bi-bar-chart',
    category: '数据分析'
  },
  
  // ==================== 数据报告 ====================
  {
    title: '数据报告',
    keywords: ['报告', 'report', '周报', '月报', '生成报告'],
    url: '/reports',
    icon: 'bi-file-earmark-bar-graph',
    category: '数据分析'
  },
  
  // ==================== 案例总结 ====================
  {
    title: '案例总结',
    keywords: ['案例', 'case', '案例研究', '成功案例'],
    url: '/case-studies',
    icon: 'bi-journal-text',
    category: '知识库'
  },
  
  // ==================== 系统设置 ====================
  {
    title: '系统设置',
    keywords: ['设置', 'settings', '配置', '系统配置'],
    url: '/settings',
    icon: 'bi-gear',
    category: '设置'
  },
  {
    title: '邮箱配置',
    keywords: ['邮箱配置', '邮箱设置', 'email settings', '绑定邮箱'],
    url: '/settings/email',
    icon: 'bi-envelope-at',
    category: '设置'
  },
  {
    title: '部门管理',
    keywords: ['部门', 'department', '部门管理', '组织架构'],
    url: '/settings/departments',
    icon: 'bi-diagram-3',
    category: '设置'
  },
  {
    title: '用户管理',
    keywords: ['用户', 'user', '用户管理', '员工管理', '成员'],
    url: '/settings/users',
    icon: 'bi-people',
    category: '设置'
  },
  {
    title: '页面权限',
    keywords: ['权限', 'permission', '页面权限', '权限管理'],
    url: '/settings/page-permissions',
    icon: 'bi-shield-lock',
    category: '设置'
  },
  {
    title: '修改密码',
    keywords: ['修改密码', '改密码', 'change password', '密码'],
    url: '/auth/change-password',
    icon: 'bi-key',
    category: '账户'
  }
];

// 全局搜索功能
class GlobalSearch {
  constructor() {
    this.searchIndex = SEARCH_INDEX;
    this.currentResults = [];
  }
  
  // 搜索功能
  search(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    const results = [];
    
    this.searchIndex.forEach(item => {
      // 计算匹配分数
      let score = 0;
      
      // 标题完全匹配得最高分
      if (item.title.toLowerCase() === searchTerm) {
        score = 100;
      }
      // 标题包含关键词
      else if (item.title.toLowerCase().includes(searchTerm)) {
        score = 80;
      }
      // 关键词完全匹配
      else if (item.keywords.some(k => k.toLowerCase() === searchTerm)) {
        score = 70;
      }
      // 关键词包含
      else if (item.keywords.some(k => k.toLowerCase().includes(searchTerm))) {
        score = 50;
      }
      
      if (score > 0) {
        results.push({
          ...item,
          score
        });
      }
    });
    
    // 按分数降序排序
    results.sort((a, b) => b.score - a.score);
    
    // 返回前10个结果
    return results.slice(0, 10);
  }
  
  // 渲染搜索结果
  renderResults(results, container) {
    if (!container) return;
    
    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-result-empty">
          <i class="bi bi-inbox"></i>
          <p>未找到相关页面</p>
        </div>
      `;
      container.style.display = 'block';
      return;
    }
    
    let html = '';
    let currentCategory = '';
    
    results.forEach(result => {
      // 如果分类改变，添加分类标题
      if (result.category !== currentCategory) {
        currentCategory = result.category;
        html += `<div class="search-result-category">${currentCategory}</div>`;
      }
      
      html += `
        <a href="${result.url}" class="search-result-item">
          <div class="d-flex align-items-center">
            <i class="${result.icon} me-3 text-primary"></i>
            <div class="flex-grow-1">
              <div class="search-result-title">${result.title}</div>
              ${result.action ? `<small class="search-result-action text-muted">${result.action}</small>` : ''}
            </div>
            <i class="bi bi-chevron-right text-muted"></i>
          </div>
        </a>
      `;
    });
    
    container.innerHTML = html;
    container.style.display = 'block';
  }
}

// 初始化全局搜索
let globalSearch = null;

document.addEventListener('DOMContentLoaded', function() {
  globalSearch = new GlobalSearch();
  
  const searchInput = document.getElementById('globalSearchInput');
  const searchResults = document.getElementById('globalSearchResults');
  
  if (searchInput && searchResults) {
    // 输入事件
    searchInput.addEventListener('input', function() {
      const query = this.value;
      
      if (!query || query.trim().length === 0) {
        searchResults.style.display = 'none';
        return;
      }
      
      const results = globalSearch.search(query);
      globalSearch.renderResults(results, searchResults);
    });
    
    // 失焦隐藏结果（延迟以允许点击）
    searchInput.addEventListener('blur', function() {
      setTimeout(() => {
        searchResults.style.display = 'none';
      }, 200);
    });
    
    // 聚焦显示结果
    searchInput.addEventListener('focus', function() {
      if (this.value.trim().length > 0) {
        const results = globalSearch.search(this.value);
        globalSearch.renderResults(results, searchResults);
      }
    });
    
    // 按ESC键清空搜索
    searchInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        this.value = '';
        searchResults.style.display = 'none';
      }
    });
  }
});

