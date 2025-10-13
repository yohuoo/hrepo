const axios = require('axios');
const config = require('../config/config');

class HunterService {
  constructor() {
    this.baseURL = config.hunter.baseUrl;
    this.apiKey = config.hunter.apiKey;
    this.timeout = config.hunter.timeout;
  }

  // 从URL中提取纯域名
  extractDomain(input) {
    try {
      let domain = input.trim().toLowerCase();
      
      // 如果输入已经是纯域名（不包含协议和路径）
      if (!domain.includes('://') && !domain.includes('/')) {
        // 去掉www前缀
        domain = domain.replace(/^www\./i, '');
        return domain;
      }

      // 尝试解析URL
      let urlString = domain;
      if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
        urlString = 'https://' + urlString;
      }

      const url = new URL(urlString);
      let hostname = url.hostname.toLowerCase();
      
      // 去掉www前缀
      hostname = hostname.replace(/^www\./i, '');
      
      return hostname;
    } catch (error) {
      // 如果解析失败，尝试简单处理
      return input.replace(/^https?:\/\//i, '')
                  .replace(/^www\./i, '')
                  .split('/')[0]
                  .toLowerCase()
                  .trim();
    }
  }

  async searchDomainContacts(domain, limit = 20) {
    try {
      // 提取纯域名
      const cleanDomain = this.extractDomain(domain);
      console.log(`🔍 Hunter搜索 - 原始输入: ${domain}, 清理后域名: ${cleanDomain}`);

      const response = await axios.get(`${this.baseURL}/domain-search`, {
        params: {
          domain: cleanDomain,
          api_key: this.apiKey,
          limit: Math.min(limit, 100) // Hunter.io最大限制100
        },
        timeout: this.timeout
      });

      console.log(`📧 Hunter.io返回数据:`, JSON.stringify(response.data, null, 2));

      if (response.data && response.data.data && response.data.data.emails) {
        // Hunter.io返回的公司名称在data.organization字段
        const organizationName = response.data.data.organization || cleanDomain;
        
        const contacts = response.data.data.emails.map(emailData => {
          // 构建姓名：优先使用first_name + last_name，否则使用邮箱用户名
          let name = '';
          if (emailData.first_name && emailData.last_name) {
            name = `${emailData.first_name} ${emailData.last_name}`;
          } else if (emailData.first_name || emailData.last_name) {
            name = emailData.first_name || emailData.last_name;
          } else if (emailData.value) {
            // 从邮箱地址提取用户名
            name = emailData.value.split('@')[0];
          } else {
            name = 'Unknown';
          }
          
          return {
            name: name,
            first_name: emailData.first_name || null,
            last_name: emailData.last_name || null,
            position: emailData.position || null,
            company: organizationName, // 使用从Hunter.io获取的公司名
            domain: cleanDomain, // 添加域名字段
            email: emailData.value || null,
            description: emailData.position ? `${emailData.position} at ${organizationName}` : `Contact at ${organizationName}`
          };
        });

        return {
          success: true,
          contacts: contacts.slice(0, limit),
          total: response.data.data.total || contacts.length,
          domain: cleanDomain
        };
      }

      return {
        success: false,
        contacts: [],
        error_message: '未找到有效的联系人数据',
        domain: cleanDomain
      };
    } catch (error) {
      console.error('Hunter API搜索失败 - 详细信息:');
      console.error('  - 状态码:', error.response?.status);
      console.error('  - 响应数据:', JSON.stringify(error.response?.data, null, 2));
      console.error('  - 错误消息:', error.message);
      
      const cleanDomain = this.extractDomain(domain);
      const errorDetail = error.response?.data?.errors?.[0]?.details || 
                         error.response?.data?.message || 
                         error.message;
      
      return {
        success: false,
        contacts: [],
        error_message: `Hunter API搜索失败: ${errorDetail}`,
        domain: cleanDomain
      };
    }
  }
}

module.exports = HunterService;
