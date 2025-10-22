/**
 * 邮件草稿管理模块
 * 功能：localStorage自动缓存 + 服务器草稿箱
 */

const EmailDraftManager = {
  // localStorage key
  CACHE_KEY: 'email_compose_cache',
  AUTO_SAVE_INTERVAL: 30000, // 30秒自动保存到localStorage
  autoSaveTimer: null,
  
  /**
   * 初始化草稿管理器
   */
  init() {
    // 页面加载时恢复缓存
    this.restoreFromCache();
    
    // 启动自动缓存
    this.startAutoCache();
    
    // 页面卸载时保存
    window.addEventListener('beforeunload', () => {
      this.saveToCache();
    });
  },
  
  /**
   * 获取当前编辑器内容
   */
  getCurrentData() {
    // 确保获取全局变量 selectedRecipients
    const recipients = (typeof selectedRecipients !== 'undefined' && selectedRecipients) ? selectedRecipients : [];
    
    return {
      senderEmailBindingId: document.getElementById('senderEmail')?.value || null,
      recipients: recipients,
      title: document.getElementById('emailTitle')?.value || '',
      content: document.getElementById('emailContent')?.value || '',
      templateId: document.getElementById('emailTemplate')?.value || null,
      timestamp: new Date().toISOString()
    };
  },
  
  /**
   * 设置编辑器内容
   */
  setData(data) {
    if (!data) return;
    
    // 设置发件邮箱
    if (data.senderEmailBindingId) {
      const senderSelect = document.getElementById('senderEmail');
      if (senderSelect) {
        senderSelect.value = data.senderEmailBindingId;
      }
    }
    
    // 设置收件人 - 确保更新全局变量
    if (data.recipients && data.recipients.length > 0) {
      // 直接赋值给全局变量
      if (typeof selectedRecipients !== 'undefined') {
        selectedRecipients.length = 0; // 清空现有数组
        selectedRecipients.push(...data.recipients); // 添加新数据
      } else {
        window.selectedRecipients = data.recipients;
      }
      
      // 调用更新显示函数（如果存在）
      if (typeof updateRecipientDisplay === 'function') {
        updateRecipientDisplay();
      }
      
      console.log('✅ 已恢复收件人:', data.recipients.length, '个');
    }
    
    // 设置标题
    if (data.title) {
      const titleInput = document.getElementById('emailTitle');
      if (titleInput) {
        titleInput.value = data.title;
      }
    }
    
    // 设置内容
    if (data.content) {
      const contentInput = document.getElementById('emailContent');
      if (contentInput) {
        contentInput.value = data.content;
      }
    }
    
    // 设置模板
    if (data.templateId) {
      const templateSelect = document.getElementById('emailTemplate');
      if (templateSelect) {
        templateSelect.value = data.templateId;
      }
    }
  },
  
  /**
   * 保存到localStorage
   */
  saveToCache() {
    try {
      const data = this.getCurrentData();
      
      // 只在有内容时保存
      if (data.title || data.content || data.recipients.length > 0) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
        console.log('💾 邮件内容已缓存到localStorage', {
          收件人数量: data.recipients.length,
          标题: data.title ? '有' : '无',
          内容长度: data.content ? data.content.length : 0
        });
        return true;
      } else {
        console.log('⏭️ 跳过缓存：无内容需要保存');
      }
    } catch (error) {
      console.error('❌ 缓存失败:', error);
      return false;
    }
  },
  
  /**
   * 从localStorage恢复
   */
  restoreFromCache() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return false;
      
      const data = JSON.parse(cached);
      
      // 检查是否有内容
      if (data.title || data.content || (data.recipients && data.recipients.length > 0)) {
        // 使用Toast提示用户恢复
        this.showRestoreToast(data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('恢复缓存失败:', error);
      return false;
    }
  },
  
  /**
   * 显示恢复提示模态框
   */
  showRestoreToast(data) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'restore-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s;
    `;
    
    // 创建卡片
    const card = document.createElement('div');
    card.className = 'card shadow-lg';
    card.style.cssText = `
      width: 90%;
      max-width: 500px;
      animation: zoomIn 0.3s;
      border: none;
    `;
    
    card.innerHTML = `
      <div class="card-header bg-primary text-white">
        <div class="d-flex align-items-center">
          <i class="bi bi-clock-history me-2" style="font-size: 1.5rem;"></i>
          <h5 class="mb-0">检测到未完成的邮件</h5>
        </div>
      </div>
      <div class="card-body">
        <div class="alert alert-info mb-3">
          <i class="bi bi-info-circle me-2"></i>
          <strong>上次编辑时间：</strong>${new Date(data.timestamp).toLocaleString()}
        </div>
        <div class="mb-3">
          <p class="mb-2"><strong>内容摘要：</strong></p>
          <ul class="list-unstyled ms-3">
            ${data.title ? `<li><i class="bi bi-envelope me-2 text-primary"></i>标题：${data.title}</li>` : ''}
            ${data.recipients && data.recipients.length > 0 ? `<li><i class="bi bi-people me-2 text-primary"></i>收件人：${data.recipients.length} 位</li>` : ''}
            ${data.content ? `<li><i class="bi bi-file-text me-2 text-primary"></i>内容：${data.content.length} 字</li>` : ''}
          </ul>
        </div>
        <p class="text-muted small mb-0">
          <i class="bi bi-lightbulb me-1"></i> 
          是否恢复这些内容继续编辑？
        </p>
      </div>
      <div class="card-footer bg-light">
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" onclick="EmailDraftManager.dismissRestore()">
            <i class="bi bi-x-circle me-1"></i> 放弃
          </button>
          <button class="btn btn-primary" onclick="EmailDraftManager.applyRestore()">
            <i class="bi bi-arrow-counterclockwise me-1"></i> 恢复内容
          </button>
        </div>
      </div>
    `;
    
    overlay.appendChild(card);
    
    // 添加动画样式
    if (!document.getElementById('restoreAnimationStyle')) {
      const style = document.createElement('style');
      style.id = 'restoreAnimationStyle';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes zoomIn {
          from {
            transform: scale(0.7);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes zoomOut {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.7);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // 保存数据供恢复使用
    this._pendingRestore = data;
    this._restoreOverlay = overlay;
    
    document.body.appendChild(overlay);
    
    // 点击遮罩层外部不关闭（防止误操作）
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // 可选：添加晃动动画提示用户需要选择
        card.style.animation = 'shake 0.5s';
        setTimeout(() => {
          card.style.animation = 'zoomIn 0.3s';
        }, 500);
      }
    });
  },
  
  /**
   * 应用恢复
   */
  applyRestore() {
    if (this._pendingRestore) {
      this.setData(this._pendingRestore);
      this._pendingRestore = null;
      
      if (this._restoreOverlay) {
        // 添加退出动画
        const card = this._restoreOverlay.querySelector('.card');
        if (card) {
          card.style.animation = 'zoomOut 0.3s';
        }
        this._restoreOverlay.style.opacity = '0';
        this._restoreOverlay.style.transition = 'opacity 0.3s';
        
        setTimeout(() => {
          if (this._restoreOverlay) {
            this._restoreOverlay.remove();
            this._restoreOverlay = null;
          }
        }, 300);
      }
      
      // 使用全局的showSuccess函数
      if (typeof showSuccess === 'function') {
        showSuccess('已恢复上次编辑的内容');
      }
    }
  },
  
  /**
   * 忽略恢复
   */
  dismissRestore() {
    if (this._pendingRestore) {
      this.clearCache();
      this._pendingRestore = null;
    }
    
    if (this._restoreOverlay) {
      // 添加退出动画
      const card = this._restoreOverlay.querySelector('.card');
      if (card) {
        card.style.animation = 'zoomOut 0.3s';
      }
      this._restoreOverlay.style.opacity = '0';
      this._restoreOverlay.style.transition = 'opacity 0.3s';
      
      setTimeout(() => {
        if (this._restoreOverlay) {
          this._restoreOverlay.remove();
          this._restoreOverlay = null;
        }
      }, 300);
    }
  },
  
  /**
   * 清除localStorage缓存
   */
  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
    console.log('🗑️ 已清除邮件缓存');
  },
  
  /**
   * 启动自动缓存
   */
  startAutoCache() {
    // 清除旧的定时器
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    // 每30秒自动保存到localStorage
    this.autoSaveTimer = setInterval(() => {
      this.saveToCache();
    }, this.AUTO_SAVE_INTERVAL);
  },
  
  /**
   * 停止自动缓存
   */
  stopAutoCache() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  },
  
  /**
   * 保存为服务器草稿
   */
  async saveToDrafts(draftName = null, isAutoSave = false) {
    try {
      const data = this.getCurrentData();
      
      if (!data.title && !data.content && data.recipients.length === 0) {
        showWarning('请至少填写标题、内容或收件人');
        return null;
      }
      
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/email-drafts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender_email_binding_id: data.senderEmailBindingId,
          recipients: data.recipients,
          title: data.title,
          content: data.content,
          template_id: data.templateId,
          draft_name: draftName,
          is_auto_save: isAutoSave
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        showSuccess(isAutoSave ? '草稿已自动保存' : '草稿已保存');
        return result.draft;
      } else {
        showError('保存草稿失败: ' + result.message);
        return null;
      }
    } catch (error) {
      console.error('保存草稿失败:', error);
      showError('保存草稿失败');
      return null;
    }
  },
  
  /**
   * 加载草稿
   */
  async loadDraft(draftId) {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/email-drafts/${draftId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.setData({
          senderEmailBindingId: result.draft.sender_email_binding_id,
          recipients: result.draft.recipients || [],
          title: result.draft.title || '',
          content: result.draft.content || '',
          templateId: result.draft.template_id
        });
        
        showSuccess('草稿已加载');
        return result.draft;
      } else {
        showError('加载草稿失败: ' + result.message);
        return null;
      }
    } catch (error) {
      console.error('加载草稿失败:', error);
      showError('加载草稿失败');
      return null;
    }
  },
  
  /**
   * 删除草稿
   */
  async deleteDraft(draftId) {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch(`/api/email-drafts/${draftId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        showSuccess('草稿已删除');
        return true;
      } else {
        showError('删除草稿失败: ' + result.message);
        return false;
      }
    } catch (error) {
      console.error('删除草稿失败:', error);
      showError('删除草稿失败');
      return false;
    }
  }
};

// 在页面加载时初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => EmailDraftManager.init());
} else {
  EmailDraftManager.init();
}

