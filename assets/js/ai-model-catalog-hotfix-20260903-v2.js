/* 凤凰花·智学模型目录热修复 v2
 * 正式站点的旧缓存可能仍运行上一版 listModels；此独立路径保证模型 ID 不被截断。
 * 只读取当前服务商公开或用户明确提供 Key 的官方模型目录，不写入项目文件。
 */
(function () {
  'use strict';
  const AI = window.AI;
  if (!AI || typeof AI.listModels !== 'function') return;
  const originalListModels = AI.listModels;
  const minCreated = Date.parse('2025-01-01T00:00:00Z') / 1000;
  const cleanBase = value => String(value || '').trim().replace(/\/(?:chat\/completions|responses|messages|models)\/?$/i, '').replace(/\/+$/, '');
  const recent = value => {
    if (value == null || value === '') return true;
    const number = Number(value);
    if (!Number.isFinite(number)) return true;
    return (number > 100000000000 ? number / 1000 : number) >= minCreated;
  };
  const typeOf = item => {
    const value = item || {};
    const architecture = value.architecture && typeof value.architecture === 'object' ? value.architecture : {};
    const modalities = [].concat(architecture.output_modalities || [], value.output_modalities || []).join(' ').toLowerCase();
    const id = String(value.id || value.name || '').toLowerCase();
    if (/image|vision|图像/.test(modalities + ' ' + id)) return 'image';
    if (/audio|speech|语音/.test(modalities + ' ' + id)) return 'audio';
    if (/video|视频/.test(modalities + ' ' + id)) return 'video';
    if (/embedding|embed|向量/.test(modalities + ' ' + id)) return 'embedding';
    if (/rerank/.test(id)) return 'rerank';
    return String(value.model_type || value.type || 'text');
  };
  const profileWithSecret = input => {
    const value = input || {};
    const stored = value.id && AI.getProfile ? AI.getProfile(value.id, true) : null;
    return Object.assign({}, stored || {}, value);
  };
  const headersFor = profile => {
    const headers = { Accept: 'application/json' };
    if (profile.apiKey) {
      if (profile.provider === 'google-ai-studio') headers['x-goog-api-key'] = profile.apiKey;
      else if (profile.provider === 'anthropic' || profile.protocol === 'anthropic-messages') {
        headers['x-api-key'] = profile.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else headers.Authorization = 'Bearer ' + profile.apiKey;
    }
    if (profile.provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location && window.location.origin || '';
      headers['X-Title'] = '凤凰花·智学';
    }
    return headers;
  };
  AI.listModels = async function (input) {
    const profile = profileWithSecret(input);
    const isPublicCatalog = profile.provider === 'openrouter';
    if (!profile.apiKey && !isPublicCatalog) return originalListModels(input);
    const base = cleanBase(profile.baseUrl || profile.endpoint || (isPublicCatalog ? 'https://openrouter.ai/api/v1' : ''));
    if (!/^https:\/\//i.test(base)) return { ok: false, models: [], message: '请先填写有效的 Base URL' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(base + '/models', { headers: headersFor(profile), signal: controller.signal });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('模型目录返回 HTTP ' + response.status);
      const raw = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : (Array.isArray(payload.models) ? payload.models : (Array.isArray(payload.results) ? payload.results : [])));
      const models = raw.map(item => {
        const id = String(item && (item.id || item.baseModelId || item.model || item.name) || '').replace(/^models\//, '');
        return {
          id, name: String(item && (item.displayName || item.name || item.id || item.baseModelId) || '').replace(/^models\//, ''),
          type: typeOf(item), pricing: item && item.pricing || null,
          contextLength: Number(item && (item.context_length || item.contextLength || item.inputTokenLimit) || 0) || null,
          capabilities: item && (item.supported_parameters || item.capabilities || []) || [], created: item && (item.created || item.created_at || item.createdAt) || null,
          status: item && (item.status || item.availability && item.availability.status) || 'available'
        };
      }).filter(item => item.id && recent(item.created));
      return { ok: true, models, message: '已载入 2025 年至今仍在官方目录中的 ' + models.length + ' 个模型' };
    } catch (error) {
      const message = error && error.name === 'AbortError' ? '读取模型目录超时，请检查网络状态。' : error && error.name === 'TypeError' ? '浏览器无法跨域读取该官方模型目录，请检查官方接口或更换支持跨域的服务商。' : String(error && error.message || '读取模型目录失败');
      return { ok: false, models: [], message };
    } finally {
      clearTimeout(timer);
    }
  };
  AI.listModels.__fhLocalCatalogHotfix = true;
})();
