/*
 * 可通过官方网络 API 获取模型目录的服务商索引。
 * 这里只保存服务商元数据和官方入口，不保存模型名称、价格或密钥。
 * 模型名称、能力、价格和可用状态由各服务商的模型列表接口同步得到。
 */
export const MODEL_PROVIDER_DIRECTORY = [
  {
    id: 'provider-openrouter', slug: 'openrouter', name: 'OpenRouter', kind: 'aggregator',
    docsUrl: 'https://openrouter.ai/docs/api/api-reference/models/get-models', pricingUrl: 'https://openrouter.ai/models', dataPolicyUrl: 'https://openrouter.ai/docs/faq',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models', pricingEndpoint: 'https://openrouter.ai/api/v1/models', availabilityEndpoint: 'https://openrouter.ai/api/v1/models', apiBase: 'https://openrouter.ai/api/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_OPENROUTER',
    metadata: { sourcePolicy: 'official_api', role: 'aggregation_platform', protocol: 'openai-chat', modelListModalities: ['text', 'image', 'audio', 'video', 'embedding'] }
  },
  {
    id: 'provider-openai', slug: 'openai', name: 'OpenAI', kind: 'official_api',
    docsUrl: 'https://platform.openai.com/docs/api-reference/models', pricingUrl: 'https://openai.com/api/pricing/', dataPolicyUrl: 'https://openai.com/enterprise-privacy/',
    modelsEndpoint: 'https://api.openai.com/v1/models', apiBase: 'https://api.openai.com/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_OPENAI',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'openai-responses' }
  },
  {
    id: 'provider-anthropic', slug: 'anthropic', name: 'Anthropic', kind: 'official_api',
    docsUrl: 'https://docs.anthropic.com/en/api/models-list', pricingUrl: 'https://www.anthropic.com/pricing', dataPolicyUrl: 'https://www.anthropic.com/legal/commercial-terms',
    modelsEndpoint: 'https://api.anthropic.com/v1/models', apiBase: 'https://api.anthropic.com/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_ANTHROPIC',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'anthropic-messages', authHeader: 'x-api-key', extraHeaders: { 'anthropic-version': '2023-06-01' }, pagination: 'afterId' }
  },
  {
    id: 'provider-google-ai-studio', slug: 'google-ai-studio', name: 'Google AI Studio', kind: 'official_api',
    docsUrl: 'https://ai.google.dev/api/models', pricingUrl: 'https://ai.google.dev/gemini-api/docs/pricing', dataPolicyUrl: 'https://ai.google.dev/gemini-api/terms',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models', apiBase: 'https://generativelanguage.googleapis.com/v1beta', authEnv: 'FH_MODEL_REGISTRY_KEY_GOOGLE_AI_STUDIO',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'google-generate-content', authHeader: 'x-goog-api-key', pagination: 'nextPageToken', googleModelId: 'baseModelId', modelPath: 'google-generate-content' }
  },
  {
    id: 'provider-deepseek', slug: 'deepseek', name: 'DeepSeek', kind: 'official_api',
    docsUrl: 'https://api-docs.deepseek.com/api/list-models', pricingUrl: 'https://api-docs.deepseek.com/quick_start/pricing', dataPolicyUrl: 'https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html',
    modelsEndpoint: 'https://api.deepseek.com/models', pricingEndpoint: 'https://api-docs.deepseek.com/quick_start/pricing', apiBase: 'https://api.deepseek.com', authEnv: 'FH_MODEL_REGISTRY_KEY_DEEPSEEK',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'openai-chat' }
  },
  {
    id: 'provider-alibaba-model-studio', slug: 'alibaba-model-studio', name: '阿里云百炼 Model Studio', kind: 'cloud_api',
    docsUrl: 'https://help.aliyun.com/zh/model-studio/list-models', pricingUrl: 'https://help.aliyun.com/zh/model-studio/models', dataPolicyUrl: 'https://terms.alicdn.com/legal-agreement/terms/suit_bu1_aliyun/suit_bu1_aliyun202112271434_86114.html',
    modelsEndpoint: 'https://dashscope.aliyuncs.com/api/v1/models', pricingEndpoint: 'https://help.aliyun.com/zh/model-studio/models', apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_ALIBABA_MODEL_STUDIO',
    metadata: { sourcePolicy: 'official_api', role: 'cloud_platform', protocol: 'openai-chat', region: 'cn-beijing' }
  },
  {
    id: 'provider-baidu-qianfan', slug: 'baidu-qianfan', name: '百度智能云千帆', kind: 'cloud_api',
    docsUrl: 'https://cloud.baidu.com/doc/qianfan-api/s/Dmba8k71y', pricingUrl: 'https://cloud.baidu.com/doc/qianfan/s/Smoghsq3g', dataPolicyUrl: 'https://cloud.baidu.com/doc/qianfan-docs/s/0m8r1domp',
    modelsEndpoint: 'https://qianfan.baidubce.com/v2/models', apiBase: 'https://qianfan.baidubce.com/v2', authEnv: 'FH_MODEL_REGISTRY_KEY_BAIDU_QIANFAN',
    metadata: { sourcePolicy: 'official_api', role: 'cloud_platform', protocol: 'openai-chat' }
  },
  {
    id: 'provider-siliconflow', slug: 'siliconflow', name: '硅基流动', kind: 'cloud_api',
    docsUrl: 'https://docs.siliconflow.cn/en/api-reference/models/get-model-list', pricingUrl: 'https://siliconflow.cn/pricing', dataPolicyUrl: 'https://siliconflow.cn/terms',
    modelsEndpoint: 'https://api.siliconflow.cn/v1/models', apiBase: 'https://api.siliconflow.cn/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_SILICONFLOW',
    metadata: { sourcePolicy: 'official_api', role: 'cloud_platform', protocol: 'openai-chat', modelTypes: ['text', 'image', 'audio', 'video', 'embedding', 'rerank'] }
  },
  {
    id: 'provider-mistral', slug: 'mistral', name: 'Mistral AI', kind: 'official_api',
    docsUrl: 'https://docs.mistral.ai/api/endpoint/models', pricingUrl: 'https://mistral.ai/technology/#pricing', dataPolicyUrl: 'https://mistral.ai/terms/',
    modelsEndpoint: 'https://api.mistral.ai/v1/models', apiBase: 'https://api.mistral.ai/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_MISTRAL',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'openai-chat' }
  },
  {
    id: 'provider-groq', slug: 'groq', name: 'GroqCloud', kind: 'cloud_api',
    docsUrl: 'https://console.groq.com/docs/models', pricingUrl: 'https://groq.com/pricing', dataPolicyUrl: 'https://groq.com/privacy-policy/',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models', apiBase: 'https://api.groq.com/openai/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_GROQ',
    metadata: { sourcePolicy: 'official_api', role: 'cloud_platform', protocol: 'openai-chat' }
  },
  {
    id: 'provider-together', slug: 'together', name: 'Together AI', kind: 'cloud_api',
    docsUrl: 'https://docs.together.ai/reference/models', pricingUrl: 'https://www.together.ai/pricing', dataPolicyUrl: 'https://www.together.ai/terms-of-service',
    modelsEndpoint: 'https://api.together.xyz/v1/models', apiBase: 'https://api.together.xyz/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_TOGETHER',
    metadata: { sourcePolicy: 'official_api', role: 'cloud_platform', protocol: 'openai-chat' }
  },
  {
    id: 'provider-fireworks', slug: 'fireworks', name: 'Fireworks AI', kind: 'cloud_api',
    docsUrl: 'https://docs.fireworks.ai/models/overview', pricingUrl: 'https://fireworks.ai/pricing', dataPolicyUrl: 'https://fireworks.ai/terms-of-service',
    modelsEndpoint: 'https://api.fireworks.ai/inference/v1/models', apiBase: 'https://api.fireworks.ai/inference/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_FIREWORKS',
    metadata: { sourcePolicy: 'official_api', role: 'cloud_platform', protocol: 'openai-chat' }
  },
  {
    id: 'provider-cohere', slug: 'cohere', name: 'Cohere', kind: 'official_api',
    docsUrl: 'https://docs.cohere.com/reference/list-models', pricingUrl: 'https://cohere.com/pricing', dataPolicyUrl: 'https://cohere.com/terms-of-use',
    modelsEndpoint: 'https://api.cohere.com/v1/models', apiBase: 'https://api.cohere.com/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_COHERE',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'cohere-chat', pagination: 'next_page_token' }
  },
  {
    id: 'provider-xai', slug: 'xai', name: 'xAI', kind: 'official_api',
    docsUrl: 'https://docs.x.ai/developers/rest-api-reference/inference/models', pricingUrl: 'https://docs.x.ai/developers/pricing', dataPolicyUrl: 'https://x.ai/legal/terms-of-service',
    modelsEndpoint: 'https://api.x.ai/v1/models', apiBase: 'https://api.x.ai/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_XAI',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'openai-chat', xaiPricingUnit: 'micro_usd_per_million_tokens' }
  },
  {
    id: 'provider-cerebras', slug: 'cerebras', name: 'Cerebras Inference', kind: 'official_api',
    docsUrl: 'https://inference-docs.cerebras.ai/api-reference/models/list-models', pricingUrl: 'https://inference-docs.cerebras.ai/support/pricing', dataPolicyUrl: 'https://inference-docs.cerebras.ai/legal/privacy-policy',
    modelsEndpoint: 'https://api.cerebras.ai/v1/models', apiBase: 'https://api.cerebras.ai/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_CEREBRAS',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'openai-chat' }
  },
  {
    id: 'provider-sambanova', slug: 'sambanova', name: 'SambaNova Cloud', kind: 'cloud_api',
    docsUrl: 'https://docs.sambanova.ai/docs/en/integrations/make', pricingUrl: 'https://sambanova.ai/pricing', dataPolicyUrl: 'https://sambanova.ai/privacy-policy',
    modelsEndpoint: 'https://api.sambanova.ai/v1/models', apiBase: 'https://api.sambanova.ai/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_SAMBANOVA',
    metadata: { sourcePolicy: 'official_api', role: 'cloud_platform', protocol: 'openai-chat' }
  },
  {
    id: 'provider-minimax', slug: 'minimax', name: 'MiniMax 开放平台', kind: 'official_api',
    docsUrl: 'https://platform.minimaxi.com/docs/api-reference/models/openai/list-models', pricingUrl: 'https://platform.minimaxi.com/docs/guides/pricing-paygo', dataPolicyUrl: 'https://www.minimaxi.com/terms',
    modelsEndpoint: 'https://api.minimaxi.com/v1/models', pricingEndpoint: 'https://platform.minimaxi.com/docs/guides/pricing-paygo', apiBase: 'https://api.minimaxi.com/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_MINIMAX',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'openai-chat', endpointPath: '/text/chatcompletion_v2' }
  },
  {
    id: 'provider-tencent-tokenhub', slug: 'tencent-tokenhub', name: '腾讯云 TokenHub', kind: 'aggregator',
    docsUrl: 'https://cloud.tencent.com/document/product/1823/130079', pricingUrl: 'https://cloud.tencent.com/document/product/1823/130051', dataPolicyUrl: 'https://cloud.tencent.com/document/product/1823',
    modelsEndpoint: 'https://tokenhub.tencentmaas.com/v1/models', pricingEndpoint: 'https://cloud.tencent.com/document/product/1823/130051', apiBase: 'https://tokenhub.tencentmaas.com/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_TENCENT_TOKENHUB',
    metadata: { sourcePolicy: 'official_api', role: 'aggregation_platform', protocol: 'openai-chat', modelListStatusField: 'status' }
  },
  {
    id: 'provider-perplexity', slug: 'perplexity', name: 'Perplexity API', kind: 'official_api',
    docsUrl: 'https://docs.perplexity.ai/api-reference/models-get', pricingUrl: 'https://docs.perplexity.ai/docs/agent-api/models', dataPolicyUrl: 'https://docs.perplexity.ai/guides/data-privacy',
    modelsEndpoint: 'https://api.perplexity.ai/v1/models', apiBase: 'https://api.perplexity.ai/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_PERPLEXITY',
    metadata: { sourcePolicy: 'official_api', role: 'original_vendor', protocol: 'openai-responses', endpointPath: '/agent' }
  },
  {
    id: 'provider-replicate', slug: 'replicate', name: 'Replicate', kind: 'aggregator',
    docsUrl: 'https://replicate.com/docs/reference/http', pricingUrl: 'https://replicate.com/pricing', dataPolicyUrl: 'https://replicate.com/terms',
    modelsEndpoint: 'https://api.replicate.com/v1/models', apiBase: 'https://api.replicate.com/v1', authEnv: 'FH_MODEL_REGISTRY_KEY_REPLICATE',
    metadata: { sourcePolicy: 'official_api', role: 'aggregation_platform', protocol: 'replicate-predictions', pagination: 'next' }
  }
];

export function providerInsertArgs(provider, stamp) {
  return [provider.id, provider.slug, provider.name, provider.kind, provider.docsUrl, provider.pricingUrl || null, provider.dataPolicyUrl || null,
    provider.modelsEndpoint, provider.pricingEndpoint || null, provider.availabilityEndpoint || null, provider.apiBase || null, provider.authEnv || null,
    'inactive', JSON.stringify(provider.metadata || {}), stamp, stamp];
}
