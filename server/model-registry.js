/* 网络模型目录的纯函数层。
 * 不保存密钥、不内置模型名单；模型名称、能力、价格与可用状态都来自服务商官方接口。
 */
'use strict';

function asObject(value) { return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
function asArray(value) { return Array.isArray(value) ? value : []; }
function text(value) { return String(value == null ? '' : value).trim(); }
function numberOrNull(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function modelType(raw) {
  const architecture = asObject(raw && raw.architecture);
  const modalities = asArray(architecture.output_modalities || raw && raw.output_modalities).map(text).filter(Boolean);
  const id = text(raw && (raw.id || raw.name)).toLowerCase();
  if (modalities.includes('image') || /image|vision|画图/.test(id)) return 'image';
  if (modalities.includes('audio') || /audio|speech|tts|transcri/.test(id)) return 'audio';
  if (modalities.includes('video') || /video/.test(id)) return 'video';
  if (/embed/.test(id) || modalities.includes('embedding')) return 'embedding';
  if (/rerank/.test(id)) return 'rerank';
  return 'text';
}
function capabilities(raw) {
  const architecture = asObject(raw && raw.architecture);
  const supported = asArray(raw && raw.supported_parameters).map(text).filter(Boolean);
  return {
    inputModalities: asArray(architecture.input_modalities || raw && raw.input_modalities).map(text).filter(Boolean),
    outputModalities: asArray(architecture.output_modalities || raw && raw.output_modalities).map(text).filter(Boolean),
    supportedParameters: supported,
    toolCalling: supported.includes('tools') || supported.includes('tool_choice') || raw && raw.tool_calling === true,
    structuredOutput: supported.includes('response_format') || supported.includes('structured_outputs') || raw && raw.structured_output === true,
    streaming: raw && raw.streaming !== false
  };
}
function providerMeta(provider) {
  if (!provider) return {};
  if (provider.metadata && typeof provider.metadata === 'object') return provider.metadata;
  try { return JSON.parse(provider.metadata_json || '{}') || {}; } catch (e) { return {}; }
}
function pricing(raw, provider) {
  const p = asObject(raw && raw.pricing);
  const meta = providerMeta(provider);
  const rawModelId = text(raw && (raw.id || raw.model || raw.name)).replace(/^models\//, '');
  const xaiPrice = key => {
    const rawValue = numberOrNull(raw && raw[key]);
    return rawValue == null ? null : rawValue / 1000000;
  };
  const field = key => numberOrNull(p[key]);
  const hasNestedPrice = Object.keys(p).length > 0;
  const overrides = asObject(meta.pricingOverrides);
  const override = !hasNestedPrice
    ? asObject(overrides[rawModelId] || (rawModelId === text(meta.defaultModel) ? meta.defaultPricing : null))
    : {};
  if (Object.keys(override).length) {
    return {
      unit: text(override.unit) || 'USD_per_token',
      currency: text(override.currency) || 'USD',
      prompt: numberOrNull(override.prompt),
      completion: numberOrNull(override.completion),
      cachedPrompt: numberOrNull(override.cachedPrompt),
      request: numberOrNull(override.request),
      image: numberOrNull(override.image),
      audio: numberOrNull(override.audio),
      source: text(override.source) || 'official_pricing_page'
    };
  }
  const xai = !hasNestedPrice && meta.xaiPricingUnit === 'micro_usd_per_token';
  return {
    unit: 'USD_per_token',
    currency: 'USD',
    prompt: xai ? xaiPrice('prompt_text_token_price') : field('prompt'),
    completion: xai ? xaiPrice('completion_text_token_price') : field('completion'),
    cachedPrompt: xai ? xaiPrice('cached_prompt_text_token_price') : field('cached_input'),
    request: field('request'),
    image: xai ? xaiPrice('prompt_image_token_price') : field('image'),
    audio: field('audio'),
    source: hasNestedPrice || xai ? 'official_model_endpoint' : 'not_published_by_endpoint'
  };
}
function normalizeProviderModel(provider, raw) {
  const item = asObject(raw);
  const meta = providerMeta(provider);
  const providerModelId = text(item.id || item.model || (meta.googleModelId && item[meta.googleModelId]) || item.name).replace(/^models\//, '');
  if (!providerModelId) return null;
  const architecture = asObject(item.architecture);
  const contextLength = numberOrNull(item.context_length || item.contextWindow || item.context_window || item.inputTokenLimit);
  const maxOutput = numberOrNull(item.max_output_tokens || item.max_completion_tokens || item.max_output || item.outputTokenLimit);
  return {
    providerId: text(provider.id),
    providerSlug: text(provider.slug),
    providerModelId,
    canonicalKey: text(provider.slug) + ':' + providerModelId,
    upstreamProvider: text(item.owned_by || item.provider || item.author || provider.name),
    officialName: text(item.displayName || item.name || providerModelId).replace(/^models\//, ''),
    exactVersion: text(item.version || item.version_id || '') || null,
    modelType: modelType(item),
    capabilities: capabilities(item),
    limits: {
      contextLength,
      maxOutput,
      perRequest: item.per_request_limits || null
    },
    pricing: pricing(item, provider),
    availability: {
      status: 'available',
      createdAt: numberOrNull(item.created),
      deprecation: text(item.deprecation || item.deprecated || '') || null,
      endpointCount: numberOrNull(item.endpoint_count || item.endpointCount)
    },
    sourceUrl: text(provider.models_endpoint),
    rawFingerprint: JSON.stringify({ id: providerModelId, version: item.version || null, pricing: item.pricing || null, architecture, contextLength, maxOutput })
  };
}
function normalizeModelsPayload(provider, payload) {
  const body = asObject(payload);
  const data = Array.isArray(payload)
    ? payload
    : asArray(body.data && body.data.length != null ? body.data : body.models || body.results || (body.output && body.output.models));
  return data.map(raw => normalizeProviderModel(provider, raw)).filter(Boolean);
}
function stableJson(value) {
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableJson(value[key])).join(',') + '}';
  return JSON.stringify(value);
}

if (typeof module !== 'undefined' && module.exports) module.exports = { normalizeProviderModel, normalizeModelsPayload, stableJson, modelType, capabilities, pricing };
