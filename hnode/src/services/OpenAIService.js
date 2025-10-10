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
            role: 'system',
            content: '你是一个专业的商业信息搜索助手。请根据用户的要求搜索相关的公司信息，并以JSON格式返回结果。不要包含任何解释性文字，只返回JSON数据。'
          },
          {
            role: 'user',
            content: '请搜索全球代糖公司、甜味剂公司的相关信息，包括公司名称、网站、描述、国家和城市。请返回20家公司的信息。'
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'search_companies',
              description: '搜索代糖和甜味剂公司信息',
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
}

module.exports = OpenAIService;
