const OpenAI = require('openai');
const config = require('../config/config');

class EmailAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseUrl || config.openai.baseURL
    });
  }

  /**
   * AI润色生成邮件
   */
  async enrichEmail(title, content) {
    try {
      const prompt = `你是一个专业的商务邮件助手。

【重要】请先分析用户提供的内容：
1. 如果内容看起来是收到的邮件（例如包含"------- 原始邮件 -------"、"发件人:"、"收件人:"、"Re:"、"回复"、或者是别人发来的问询/请求等），你的任务是：
   - 生成一封专业的【回复邮件】来回应这封邮件
   - 标题：如果原标题已有"Re:"则保持，否则添加"Re: "前缀
   - 内容格式：
     * 第一部分：写回复内容（针对原邮件的问题/请求进行回应）
     * 第二部分：保留完整的原始邮件引用（包括"------- 原始邮件 -------"分隔线及其下方的所有内容）
   - 这样做的目的是让收件人清楚地看到你在回复哪封邮件

2. 如果内容看起来是用户自己写的草稿（没有原始邮件引用），你的任务是：
   - 优化和改进这封邮件，使其更专业、友好、有说服力
   - 保持原有意图，提升表达质量

【个性化变量使用规则】
- 可用的个性化变量（发送时会自动替换为真实信息）：
  * {{firstName}} - 收件人的名字
  * {{lastName}} - 收件人的姓氏  
  * {{company}} - 收件人的公司名称
  * {{position}} - 收件人的职位

- **重要：请主动在生成的邮件中合理使用这些变量**，例如：
  * 称呼：使用 "{{firstName}}先生/女士" 或 "{{lastName}}总" 而不是通用的"您好"
  * 提及公司：使用 "{{company}}" 而不是"贵公司"
  * 如果涉及职位可以用：作为{{company}}的{{position}}
  
- 注意事项：
  * 如果原邮件中已经有这些变量，务必保留不要修改
  * 在问候语、正文中合适的位置主动添加这些变量
  * 让每封邮件都有个性化的称呼和提及，不要只用"您好"这样的泛称

【格式要求】
- 保持商务邮件的专业风格和礼貌语气
- 可以优化问候语、结束语等，使邮件更完整
- 不要添加发件人签名（如"此致敬礼"、"祝好"等），只生成邮件正文

【回复邮件格式示例】
如果是回复邮件，生成的content应该是：
"""
{{firstName}}先生/女士，您好！

感谢{{company}}对我们产品的关注。

[这里是你的回复内容，针对原邮件的问题进行回应，记得在合适的地方使用个性化变量]

期待与您进一步交流。

------- 原始邮件 -------
[保留用户提供的完整原始邮件部分，包括分隔线、发件人、发送时间、主题和原邮件内容]
"""

注意：称呼部分一定要用 {{firstName}} 或 {{lastName}}，让邮件更有针对性！

【原始内容】
标题：${title || '（无标题）'}
内容：
${content}

请分析后生成合适的邮件（回复或优化）。`;

      // 使用普通对话模式（更兼容）
      // 注意：某些模型不支持自定义 temperature 和 max_completion_tokens，所以只传必需参数
      const requestParams = {
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的商务邮件写作助手。你能够智能识别用户输入的内容：如果是收到的邮件则生成回复，如果是草稿则进行优化。你必须在生成的邮件中主动使用个性化变量（如{{firstName}}、{{company}}等）来让邮件更有针对性。你必须严格按照JSON格式返回结果。'
          },
          {
            role: 'user',
            content: prompt + '\n\n请严格按照以下JSON格式返回（可以使用```json代码块包裹）：\n```json\n{"title": "优化后的标题", "content": "优化后的内容"}\n```'
          }
        ]
      };
      
      const response = await this.openai.chat.completions.create(requestParams);

      console.log('AI响应:', JSON.stringify(response.choices[0].message, null, 2));

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error('AI未返回任何内容');
      }

      let result;
      try {
        // 尝试直接解析JSON
        result = JSON.parse(messageContent);
      } catch (parseError) {
        // 如果直接解析失败，尝试提取JSON代码块
        console.log('直接解析失败，尝试提取JSON代码块');
        
        // 先尝试提取 ```json 代码块
        let jsonStr = null;
        const jsonBlockMatch = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          jsonStr = jsonBlockMatch[1].trim();
        } else {
          // 如果没有json标记，尝试提取普通代码块
          const codeBlockMatch = messageContent.match(/```\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          } else {
            // 最后尝试直接提取JSON对象（寻找第一个完整的{...}）
            const directJsonMatch = messageContent.match(/\{[\s\S]*?\}\s*$/);
            if (directJsonMatch) {
              jsonStr = directJsonMatch[0].trim();
            }
          }
        }
        
        if (jsonStr) {
          try {
            // 清理可能的多余花括号（如果末尾有多个}，只保留配对的部分）
            if (jsonStr.startsWith('{')) {
              // 计算花括号是否配对
              let openCount = 0;
              let closeCount = 0;
              let validEnd = jsonStr.length;
              
              for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === '{') openCount++;
                if (jsonStr[i] === '}') {
                  closeCount++;
                  if (openCount === closeCount) {
                    validEnd = i + 1;
                    break;
                  }
                }
              }
              
              jsonStr = jsonStr.substring(0, validEnd);
            }
            
            result = JSON.parse(jsonStr);
          } catch (e) {
            console.error('JSON解析失败:', e.message);
            console.error('尝试解析的字符串:', jsonStr);
            throw new Error('AI返回的内容格式不正确: ' + e.message);
          }
        } else {
          console.error('无法从响应中提取JSON，原始内容:', messageContent);
          throw new Error('AI返回的内容格式不正确');
        }
      }
      
      return {
        title: result.title || title,
        content: result.content || content
      };

    } catch (error) {
      console.error('AI邮件润色失败:', error);
      throw new Error(`AI邮件润色失败: ${error.message}`);
    }
  }

  /**
   * 翻译邮件
   */
  async translateEmail(title, content, targetLanguage = null) {
    try {
      let prompt = `你是一个专业的邮件翻译助手。

重要规则：
1. 保留所有变量（如 {{company}}, {{firstName}}, {{lastName}}, {{position}}）完全不翻译
2. 变量周围的文字正常翻译
3. 保持邮件的专业性和原有语气
4. 准确传达原文的意思

`;

      if (targetLanguage) {
        prompt += `请将以下邮件翻译成${targetLanguage}：\n\n`;
      } else {
        prompt += `请识别源语言并进行翻译：

**翻译规则（严格遵守）：**
1. 如果原文主要是中文 → 必须翻译成英文
2. 如果原文主要是英文 → 必须翻译成中文
3. 如果包含其他语言 → 翻译成中文

`;
      }

      prompt += `**原邮件标题：**
${title || '（无标题）'}

**原邮件内容：**
${content}

请识别语言并翻译。注意：一定要翻译成不同的语言，不能保持原语言！`;

      // 使用普通对话模式（更兼容）
      // 注意：某些模型不支持自定义 temperature 和 max_completion_tokens，所以只传必需参数
      const requestParams = {
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的商务邮件翻译助手。你必须识别邮件的原始语言，然后翻译成不同的语言（中文↔英文）。保留邮件变量{{...}}不翻译。必须以JSON格式返回。'
          },
          {
            role: 'user',
            content: prompt + '\n\n请严格按照以下JSON格式返回（可以使用```json代码块包裹）：\n```json\n{"title": "翻译后的标题", "content": "翻译后的内容", "detected_language": "zh或en", "target_language": "zh或en"}\n```\n\n重要提示：detected_language和target_language必须不同！如果原文是中文(zh)，目标必须是英文(en)；如果原文是英文(en)，目标必须是中文(zh)。'
          }
        ]
      };
      
      console.log('📤 发送翻译请求，原文摘要:', content.substring(0, 100) + '...');
      
      const response = await this.openai.chat.completions.create(requestParams);

      console.log('📥 AI翻译响应:', JSON.stringify(response.choices[0].message, null, 2));

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error('AI未返回任何翻译内容');
      }
      
      console.log('📝 AI返回的原始内容:', messageContent);

      let result;
      try {
        // 尝试直接解析JSON
        result = JSON.parse(messageContent);
      } catch (parseError) {
        // 如果直接解析失败，尝试提取JSON代码块
        console.log('直接解析失败，尝试提取JSON代码块');
        
        // 先尝试提取 ```json 代码块
        let jsonStr = null;
        const jsonBlockMatch = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          jsonStr = jsonBlockMatch[1].trim();
        } else {
          // 如果没有json标记，尝试提取普通代码块
          const codeBlockMatch = messageContent.match(/```\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          } else {
            // 最后尝试直接提取JSON对象（寻找第一个完整的{...}）
            const directJsonMatch = messageContent.match(/\{[\s\S]*?\}\s*$/);
            if (directJsonMatch) {
              jsonStr = directJsonMatch[0].trim();
            }
          }
        }
        
        if (jsonStr) {
          try {
            // 清理可能的多余花括号（如果末尾有多个}，只保留配对的部分）
            if (jsonStr.startsWith('{')) {
              // 计算花括号是否配对
              let openCount = 0;
              let closeCount = 0;
              let validEnd = jsonStr.length;
              
              for (let i = 0; i < jsonStr.length; i++) {
                if (jsonStr[i] === '{') openCount++;
                if (jsonStr[i] === '}') {
                  closeCount++;
                  if (openCount === closeCount) {
                    validEnd = i + 1;
                    break;
                  }
                }
              }
              
              jsonStr = jsonStr.substring(0, validEnd);
            }
            
            result = JSON.parse(jsonStr);
          } catch (e) {
            console.error('JSON解析失败:', e.message);
            console.error('尝试解析的字符串:', jsonStr);
            throw new Error('AI返回的翻译内容格式不正确: ' + e.message);
          }
        } else {
          console.error('无法从响应中提取JSON，原始内容:', messageContent);
          throw new Error('AI返回的翻译内容格式不正确');
        }
      }
      
      const finalResult = {
        title: result.title || title,
        content: result.content || content,
        detected_language: result.detected_language,
        target_language: result.target_language
      };
      
      console.log('✅ 翻译完成:', {
        原文语言: finalResult.detected_language,
        目标语言: finalResult.target_language,
        原标题: title.substring(0, 50),
        译文标题: finalResult.title.substring(0, 50)
      });
      
      return finalResult;

    } catch (error) {
      console.error('邮件翻译失败:', error);
      throw new Error(`邮件翻译失败: ${error.message}`);
    }
  }

  /**
   * AI生成合同建议信息
   * 基于客户的邮件往来和销售记录
   */
  async suggestContractInfo(context) {
    try {
      const { customer, emails, sales } = context;
      
      const prompt = `你是一个专业的商务合同助手。请基于以下客户信息，生成合同建议。

**重要说明：**
- 这是一份销售合同
- 甲方 = 客户公司（买方）
- 乙方 = 我们公司（卖方）

**客户信息（甲方）：**
- 客户姓名：${customer.name}
- 公司名称：${customer.company}
- 邮箱：${customer.email}

**历史沟通记录：**
${emails.length > 0 ? emails.map((e, i) => `
${i + 1}. [${e.type === 'sent' ? '发送' : '接收'}] ${e.title || '(无标题)'}
   时间：${new Date(e.date).toLocaleDateString('zh-CN')}
   内容摘要：${e.content.substring(0, 200)}...
`).join('\n') : '暂无邮件记录'}

**历史销售记录：**
${sales.length > 0 ? sales.map((s, i) => `
${i + 1}. 产品：${s.product}，数量：${s.quantity}，金额：${s.currency} ${s.amount}
   日期：${new Date(s.date).toLocaleDateString('zh-CN')}
`).join('\n') : '暂无销售记录'}

请分析以上信息，生成合同建议。
- party_a_name（甲方名称）必须填写客户的公司名称
- 如果信息不足，则使用默认值或留空。`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的商务合同助手。在销售合同中，甲方是客户公司（买方），乙方是我们公司（卖方）。请分析客户的沟通和交易历史，生成合理的合同信息建议。必须以JSON格式返回。'
          },
          {
            role: 'user',
            content: prompt + '\n\n请严格按照以下JSON格式返回（可以使用```json代码块包裹）：\n```json\n{"party_a_name": "客户的公司名称", "party_b_name": "浩天药业有限公司", "purchase_product": "采购商品", "purchase_quantity": 0, "estimated_delivery_date": "YYYY-MM-DD", "contract_amount": 0, "currency": "USD"}\n```\n\n注意：\n- party_a_name必须是客户的公司名称\n- party_b_name固定为"浩天药业有限公司"（我们公司）'
          }
        ]
      });

      console.log('AI合同建议响应:', JSON.stringify(response.choices[0].message, null, 2));

      const messageContent = response.choices[0].message.content;
      if (!messageContent) {
        throw new Error('AI未返回任何内容');
      }

      let result;
      try {
        // 尝试直接解析JSON
        result = JSON.parse(messageContent);
      } catch (parseError) {
        // 提取JSON代码块
        console.log('直接解析失败，尝试提取JSON代码块');
        
        let jsonStr = null;
        const jsonBlockMatch = messageContent.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          jsonStr = jsonBlockMatch[1].trim();
        } else {
          const codeBlockMatch = messageContent.match(/```\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          } else {
            const directJsonMatch = messageContent.match(/\{[\s\S]*?\}\s*$/);
            if (directJsonMatch) {
              jsonStr = directJsonMatch[0].trim();
            }
          }
        }
        
        if (jsonStr) {
          // 清理多余的花括号
          if (jsonStr.startsWith('{')) {
            let openCount = 0;
            let closeCount = 0;
            let validEnd = jsonStr.length;
            
            for (let i = 0; i < jsonStr.length; i++) {
              if (jsonStr[i] === '{') openCount++;
              if (jsonStr[i] === '}') {
                closeCount++;
                if (openCount === closeCount) {
                  validEnd = i + 1;
                  break;
                }
              }
            }
            
            jsonStr = jsonStr.substring(0, validEnd);
          }
          
          result = JSON.parse(jsonStr);
        } else {
          console.error('无法提取JSON，原始内容:', messageContent);
          throw new Error('AI返回的内容格式不正确');
        }
      }
      
      return {
        party_a_name: result.party_a_name || customer.company || '',
        party_b_name: result.party_b_name || '浩天药业有限公司',
        purchase_product: result.purchase_product || '',
        purchase_quantity: result.purchase_quantity || 0,
        estimated_delivery_date: result.estimated_delivery_date || null,
        contract_amount: result.contract_amount || 0,
        currency: result.currency || 'USD'
      };

    } catch (error) {
      console.error('AI生成合同建议失败:', error);
      throw new Error(`AI生成合同建议失败: ${error.message}`);
    }
  }
}

module.exports = EmailAIService;


