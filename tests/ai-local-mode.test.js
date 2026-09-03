/* AI 本地浏览器模式回归测试。运行：node tests/ai-local-mode.test.js */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function makeStorage(seed) {
  const data = Object.assign({}, seed || {});
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null; },
    setItem(key, value) { data[key] = String(value); },
    removeItem(key) { delete data[key]; },
    dump() { return Object.assign({}, data); }
  };
}

function loadAI(storage, fetchImpl) {
  const context = {
    console,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: fetchImpl,
    location: { origin: 'http://127.0.0.1:8080' },
    window: { localStorage: storage, dispatchEvent() {} }
  };
  vm.runInNewContext(fs.readFileSync('assets/js/ai.js', 'utf8'), context, { filename: 'assets/js/ai.js' });
  return { context, ai: context.window.AI };
}

(async () => {
  const storage = makeStorage();
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    if (String(url).endsWith('/models')) {
      return { ok: true, json: async () => ({ data: [{ id: 'glm-4-flash-250414', name: 'GLM-4-Flash', pricing: { prompt: 0, completion: 0 } }] }) };
    }
    return { ok: true, json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] }) };
  };

  const loaded = loadAI(storage, fakeFetch);
  const context = loaded.context;
  const ai = loaded.ai;
  assert.equal((await ai.serverStatus()).route, 'local');
  assert.equal(calls.length, 0, '本地状态检查不应请求后端');

  const saved = ai.saveProfile({
    id: ai.getConfig().activeProfileId,
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    protocol: 'openai-chat',
    model: 'openai/gpt-4o-mini',
    apiKey: 'sk-local-test'
  }, { activate: true });
  assert.equal(saved.hasKey, true);
  assert.equal(ai.isConfigured(), true);

  const answer = await ai.chat([{ role: 'user', content: '测试' }], { maxTokens: 20 });
  assert.equal(answer, '{"ok":true}');
  assert.equal(calls[0].url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer sk-local-test');

  const models = await ai.listModels(Object.assign({}, saved, { model: '' }));
  assert.equal(models.ok, true);
  assert.equal(models.models[0].id, 'glm-4-flash-250414');
  assert.equal(models.models[0].pricing.prompt, 0);
  const publicModels = await ai.listModels({ id: 'openrouter-public-catalog', provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', model: '', apiKey: '' });
  assert.equal(publicModels.ok, true, 'OpenRouter 公共模型目录不应强制要求 API Key');

  vm.runInNewContext(fs.readFileSync('assets/js/reference-data.js', 'utf8'), context, { filename: 'assets/js/reference-data.js' });
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(context.window.AI.listModels.__fhRegistryBridge, undefined, '无后端时参考数据层不应覆盖浏览器直连模型目录');

  const refreshed = loadAI(storage, async () => ({ ok: false, json: async () => ({}) })).ai;
  assert.equal(refreshed.getConfig().activeProfile.provider, 'openrouter');
  assert.equal(refreshed.getProfile(saved.id, true).apiKey, 'sk-local-test');
  assert.equal(refreshed.isConfigured(), true);

  console.log('ai-local-mode tests: passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
