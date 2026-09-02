/* AI 默认连接回归测试。运行：node tests/ai-default.test.js */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = {
  console,
  URL,
  setTimeout,
  clearTimeout,
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  window: { dispatchEvent() {} }
};
vm.runInNewContext(fs.readFileSync('assets/js/ai.js', 'utf8'), context, { filename: 'assets/js/ai.js' });

const ai = context.window.AI;
const config = ai.getConfig();
assert.equal(ai.DEFAULT_PROVIDER, 'zhipu');
assert.equal(ai.DEFAULT_MODEL, 'glm-4-flash-250414');
assert.equal(config.activeProfile.provider, 'zhipu');
assert.equal(config.activeProfile.model, 'glm-4-flash-250414');
assert.equal(config.activeProfile.baseUrl, 'https://open.bigmodel.cn/api/paas/v4');
assert.equal(config.activeProfile.hasKey, false);
assert.equal(ai.defaultProfile('zhipu').name, '智谱 GLM-4-Flash（默认）');
console.log('ai-default tests: passed');
