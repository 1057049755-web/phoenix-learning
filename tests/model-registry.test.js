/* 网络模型目录纯函数测试。运行：node tests/model-registry.test.js */
'use strict';

const assert = require('node:assert/strict');
(async () => {
  const { normalizeModelsPayload, stableJson } = await import('../server/model-registry.mjs');
  const { MODEL_PROVIDER_DIRECTORY } = await import('../server/provider-directory.mjs');
  assert.equal(MODEL_PROVIDER_DIRECTORY.length, 21);
  assert.equal(new Set(MODEL_PROVIDER_DIRECTORY.map(item => item.slug)).size, 21);
  assert.equal(MODEL_PROVIDER_DIRECTORY.filter(item => item.kind === 'aggregator').length, 3);
  const perplexity = MODEL_PROVIDER_DIRECTORY.find(item => item.slug === 'perplexity');
  assert.equal(perplexity.metadata.protocol, 'openai-responses');
  assert.equal(perplexity.metadata.endpointPath, '/agent');
  const zhipu = MODEL_PROVIDER_DIRECTORY.find(item => item.slug === 'zhipu');
  assert.equal(zhipu.metadata.defaultModel, 'glm-4-flash-250414');
  assert.equal(zhipu.metadata.defaultPricing.prompt, 0);
  const provider = { id: 'provider-openrouter', slug: 'openrouter', name: 'OpenRouter', models_endpoint: 'https://openrouter.ai/api/v1/models' };
  const models = normalizeModelsPayload(provider, { data: [{
    id: 'vendor/model-1', name: 'Model 1', owned_by: 'vendor', context_length: 32768,
    architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] },
    supported_parameters: ['tools', 'response_format'],
    pricing: { prompt: '0.000001', completion: '0.000002' }
  }] });
  assert.equal(models.length, 1);
  assert.equal(models[0].canonicalKey, 'openrouter:vendor/model-1');
  assert.equal(models[0].limits.contextLength, 32768);
  assert.equal(models[0].capabilities.toolCalling, true);
  assert.equal(models[0].capabilities.structuredOutput, true);
  assert.equal(models[0].pricing.prompt, 0.000001);
  assert.equal(models[0].availability.status, 'available');
  const zhipuModels = normalizeModelsPayload(zhipu, { data: [{ id: 'glm-4-flash-250414' }] });
  assert.equal(zhipuModels[0].pricing.currency, 'CNY');
  assert.equal(zhipuModels[0].pricing.prompt, 0);
  assert.equal(zhipuModels[0].pricing.source, 'official_pricing_page');
  assert.equal(normalizeModelsPayload(provider, { data: [{}] }).length, 0);
  const google = { id: 'provider-google-ai-studio', slug: 'google-ai-studio', name: 'Google AI Studio', models_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models', metadata_json: '{"googleModelId":"baseModelId"}' };
  const googleModels = normalizeModelsPayload(google, { models: [{ name: 'models/gemini-3.6-flash', baseModelId: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash', inputTokenLimit: 1000, outputTokenLimit: 500 }] });
  assert.equal(googleModels[0].providerModelId, 'gemini-3.6-flash');
  assert.equal(googleModels[0].officialName, 'Gemini 3.6 Flash');
  const xai = { id: 'provider-xai', slug: 'xai', name: 'xAI', models_endpoint: 'https://api.x.ai/v1/models', metadata_json: '{"xaiPricingUnit":"micro_usd_per_token"}' };
  const xaiModels = normalizeModelsPayload(xai, { data: [{ id: 'grok-example', prompt_text_token_price: 12500, completion_text_token_price: 25000 }] });
  assert.equal(xaiModels[0].pricing.prompt, 0.0125);
  assert.equal(xaiModels[0].pricing.completion, 0.025);
  assert.equal(normalizeModelsPayload(provider, [{ id: 'array-model' }]).length, 1);
  assert.equal(stableJson({ b: 1, a: 2 }), '{"a":2,"b":1}');
  console.log('model-registry tests: passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
