const OpenAI = require('openai');
const config = require('../config/config');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl,
      timeout: config.openai.timeout,
      maxRetries: 2  // OpenAI SDK内置重试
    });
  }

  async searchCompaniesWithFunctionCall(maxResults = 20, excludeCompanies = [], retryCount = 0) {
    const MAX_RETRIES = 3;
    
    try {
      // 构建排除公司的文本（简化格式，节省token）
      let excludeText = '';
      if (excludeCompanies && excludeCompanies.length > 0) {
        // 只显示公司名称，不显示域名，节省token
        const companyNames = excludeCompanies.map(c => c.name).join(', ');
        excludeText = `\n\n**重要：以下${excludeCompanies.length}家公司已搜索过，请排除：${companyNames}**`;
        console.log(`🚫 排除最近 ${excludeCompanies.length} 家已搜索公司`);
      }
      
      console.log(`🔄 调用OpenAI API（尝试 ${retryCount + 1}/${MAX_RETRIES + 1}）...`);
      
      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            "role": "system",
            "content": "你是一名专业的商业情报分析助手，擅长为指定公司寻找潜在客户。你的任务是根据用户提供的公司主营业务，分析其潜在客户画像，并检索符合该画像的企业信息。输出时请仅返回JSON数据，不要包含解释性文字。**请确保返回的公司都是新的、不重复的公司。**"
          },
          {
            "role": "user",
            "content": `浩天科技是一家专注于代糖、甜味剂（如甜叶菊、赤藓糖醇、三氯蔗糖等）研发和销售的企业。请帮我搜索全球范围内**可能成为浩天科技客户的公司**，例如食品制造商、饮料公司、健康食品品牌、糖尿病食品厂商、餐饮连锁集团等。请返回20家**新的、不重复的**潜在客户的公司信息，字段包括：company_name、website、description、country、city。${excludeText}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'search_companies',
              description: '搜索浩天科技的潜在客户',
              parameters: {
                type: 'object',
                properties: {
                  companies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        company_name: {
                          type: 'string',
                          description: '公司名称'
                        },
                        website: {
                          type: 'string',
                          description: '公司网站'
                        },
                        description: {
                          type: 'string',
                          description: '公司描述'
                        },
                        country: {
                          type: 'string',
                          description: '所在国家'
                        },
                        city: {
                          type: 'string',
                          description: '所在城市'
                        }
                      },
                      required: ['company_name', 'website', 'description', 'country', 'city']
                    }
                  }
                },
                required: ['companies']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'search_companies' } },
        max_completion_tokens: 16000  // 增加到16000，为GPT-5的推理token预留空间
        // 注意：GPT-5模型不支持自定义temperature参数
      });

      console.log('🔍 OpenAI响应:', JSON.stringify(response, null, 2));

      if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.tool_calls) {
        const toolCall = response.choices[0].message.tool_calls[0];
        if (toolCall && toolCall.function && toolCall.function.name === 'search_companies') {
          const functionArgs = JSON.parse(toolCall.function.arguments);
          return {
            success: true,
            companies: functionArgs.companies || [],
            raw_response: response
          };
        }
      }

      return {
        success: false,
        companies: [],
        error_message: '未找到有效的公司数据',
        raw_response: response
      };
    } catch (error) {
      console.error(`❌ OpenAI API调用失败（尝试 ${retryCount + 1}/${MAX_RETRIES + 1}）:`, error.message);
      
      // 如果是网络错误、超时或5xx错误，且未达到最大重试次数，则重试
      const shouldRetry = retryCount < MAX_RETRIES && (
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.status >= 500
      );
      
      if (shouldRetry) {
        console.log(`🔄 等待 ${(retryCount + 1) * 2} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return this.searchCompaniesWithFunctionCall(maxResults, excludeCompanies, retryCount + 1);
      }
      
      // 记录详细错误信息
      console.error('OpenAI API详细错误信息:');
      console.error('  - 错误类型:', error.constructor.name);
      console.error('  - 错误代码:', error.code);
      console.error('  - 错误消息:', error.message);
      console.error('  - HTTP状态:', error.status);
      console.error('  - 响应数据:', error.response?.data);
      
      return {
        success: false,
        companies: [],
        error_message: `OpenAI API调用失败: ${error.message}`,
        raw_response: null
      };
    }
  }

  /**
   * 通用的文本生成方法（用于报告生成等）
   * @param {Array} messages - 消息数组
   * @param {Object} options - 配置选项
   * @returns {String} 生成的文本内容
   */
  async generateCompletion(messages, options = {}) {
    try {
      const requestParams = {
        model: config.openai.model,
        messages: messages
      };
      
      // 只添加支持的参数（某些模型不支持temperature等参数）
      // if (options.temperature !== undefined) {
      //   requestParams.temperature = options.temperature;
      // }
      // if (options.maxTokens !== undefined) {
      //   requestParams.max_completion_tokens = options.maxTokens;
      // }
      
      console.log('🤖 调用OpenAI生成文本...');
      
      const response = await this.client.chat.completions.create(requestParams);
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('AI未返回任何内容');
      }
      
      console.log('✅ AI生成完成，长度:', content.length);
      
      return content;
    } catch (error) {
      console.error('❌ OpenAI生成失败:', error);
      throw new Error(`AI生成失败: ${error.message}`);
    }
  }
}

module.exports = OpenAIService;
