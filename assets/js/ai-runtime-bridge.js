/* 凤凰花·智学 AI 本地运行时适配层 v2
 * 当前项目没有可运行后端。本文件只提供旧页面依赖的运行时兼容对象，
 * 不再拦截、改写或转发 AI.chat / AI.testProfile / AI.saveProfile。
 * 实际请求统一由 assets/js/ai.js 从浏览器直连服务商官方 API。
 */
(function () {
  'use strict';
  const AI = window.AI;
  if (!AI) return;

  function activeProfile() {
    const config = AI.getConfig ? AI.getConfig() : {};
    return AI.getProfile && config.activeProfileId ? AI.getProfile(config.activeProfileId, true) : null;
  }
  function endpoint(profileValue) {
    const profile = profileValue || {};
    if (AI.connectionEndpoint) return AI.connectionEndpoint(profile);
    const base = String(profile.baseUrl || profile.endpoint || '').replace(/\/+$/, '');
    const suffix = profile.endpointPath || ({
      'openai-chat': '/chat/completions', 'openai-responses': '/responses',
      'anthropic-messages': '/messages', 'cohere-chat': '/chat', 'replicate-predictions': '/predictions'
    })[profile.protocol] || '/chat/completions';
    return base ? base + suffix : '';
  }

  /* 兼容旧页面读取活跃连接；Key 由 ai.js 的同一套本地存储管理。 */
  window.FH_AI_RUNTIME = Object.freeze({
    version: 'runtime-bridge.local.v2',
    getActiveProfile: activeProfile,
    endpoint: endpoint
  });
})();
