const OpenAI = require('openai');
const config = require('../config/config');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl
    });
  }

  async searchCompaniesWithFunctionCall(maxResults = 20) {
    try {
      const response = await this.client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            "role": "system",
            "content": "你是一名专业的商业情报分析助手，擅长为指定公司寻找潜在客户。你的任务是根据用户提供的公司主营业务，分析其潜在客户画像，并检索符合该画像的企业信息。输出时请仅返回JSON数据，不要包含解释性文字。"
          },
          {
            "role": "user",
            "content": "浩天科技是一家专注于代糖、甜味剂（如甜叶菊、赤藓糖醇、三氯蔗糖等）研发和销售的企业。请帮我搜索全球范围内**可能成为浩天科技客户的公司**，例如食品制造商、饮料公司、健康食品品牌、糖尿病食品厂商、餐饮连锁集团等。请返回20家潜在客户的公司信息，字段包括：company_name、website、description、country、city。"
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
        max_completion_tokens: config.openai.maxTokens
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
      console.error('OpenAI API调用失败:', error);
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
