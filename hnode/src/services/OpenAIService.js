const OpenAI = require('openai');
const { performance } = require('perf_hooks');
const config = require('../config/config');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl,
      timeout: config.openai.timeout,
      maxRetries: 2  // OpenAI SDK内置重试
    });
    this.primaryModel = config.openai.model;
    this.fastModel = config.openai.fastModel || config.openai.model;
  }

  async searchCompaniesWithFunctionCall(maxResults = 10, excludeCompanies = [], retryCount = 0) {
    const MAX_RETRIES = 1; // 减少重试次数
    const selectedModel = this.fastModel;
    
    try {
      // 构建排除公司的文本（极简格式，节省token）
      let excludeText = '';
      if (excludeCompanies && excludeCompanies.length > 0) {
        // 只显示前5家公司名称，大幅节省token
        const companyNames = excludeCompanies.slice(0, 5).map(c => c.name).join(', ');
        excludeText = `\n排除：${companyNames}`;
        console.log(`🚫 排除最近 ${Math.min(excludeCompanies.length, 5)} 家已搜索公司`);
      }
      
      console.log(`🔄 调用OpenAI API（尝试 ${retryCount + 1}/${MAX_RETRIES + 1}）...`);
      
      // 兼容不同提供方的 tokens 参数（Claude 通常为 max_tokens）
      const useClaude = typeof selectedModel === 'string' && selectedModel.toLowerCase().includes('claude');
      const tokensOption = useClaude
        ? { max_tokens: Math.min(config.openai.maxTokens, 2000) }
        : { max_completion_tokens: Math.min(config.openai.maxTokens, 2000) };

      const apiStart = performance.now();
      let response;
      try {
        response = await this.client.chat.completions.create({
          model: selectedModel,
          messages: [
            {
              "role": "system",
              "content": "你是一名专业的商业情报分析助手，擅长为指定公司寻找潜在客户。你的任务是根据用户提供的公司主营业务，分析其潜在客户画像，并检索符合该画像的企业信息。输出时请仅返回JSON数据，不要包含解释性文字。**请确保返回的公司都是新的、不重复的公司。**"
            },
            {
              "role": "user",
              "content": `浩天科技是一家专注于代糖、甜味剂（甜叶菊、赤藓糖醇、三氯蔗糖等）研发和销售的企业。请帮我搜索全球范围内**最匹配的潜在客户公司**，例如食品制造商、饮料公司、健康食品品牌、糖尿病食品厂商、餐饮连锁集团等。

要求：
1. 返回${maxResults}家**新的、不重复的**潜在客户公司
2. company_name、website、country、city 这些字段保持原始语言（通常是英文）
3. **description 字段用不超过40个中文字符**简要描述主营业务及与代糖的关联
${excludeText}`
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
                          description: '公司描述（中文，40字以内）'
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
        ...tokensOption
        // 注意：GPT-5模型不支持自定义temperature参数
      });
      } finally {
        const duration = performance.now() - apiStart;
        console.log(`⏱️ [OpenAIService] chat.completions耗时 ${duration.toFixed(0)} ms (model: ${selectedModel})`);
      }

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
        console.log(`🔄 等待 ${(retryCount + 1) * 1} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000)); // 减少等待时间
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
      const model = config.openai.model;
      const requestParams = {
        model: model,
        messages: messages
      };
      
      // 根据模型类型添加支持的参数
      if (options.maxTokens !== undefined) {
        if (model.toLowerCase().includes('claude')) {
          requestParams.max_tokens = options.maxTokens;
        } else if (model.includes('gpt-5')) {
          requestParams.max_completion_tokens = options.maxTokens;
        } else {
          requestParams.max_tokens = options.maxTokens;
        }
      }
      
      if (options.temperature !== undefined) {
        requestParams.temperature = options.temperature;
      }
      
      console.log('🤖 调用AI生成文本...', {
        model: model,
        maxTokens: options.maxTokens,
        messageLength: JSON.stringify(messages).length
      });
      
      const startTime = Date.now();
      const response = await this.client.chat.completions.create(requestParams);
      const duration = Date.now() - startTime;
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('AI未返回任何内容');
      }
      
      console.log('✅ AI生成完成', {
        耗时: `${duration}ms`,
        输出长度: content.length,
        使用tokens: response.usage?.total_tokens || '未知'
      });
      
      return content;
    } catch (error) {
      console.error('❌ OpenAI生成失败:', error);
      throw new Error(`AI生成失败: ${error.message}`);
    }
  }
}

module.exports = OpenAIService;
