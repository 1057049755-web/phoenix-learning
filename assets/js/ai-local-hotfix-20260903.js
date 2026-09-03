/* 凤凰花·智学 AI 本地模式热修复
 * 用独立资源路径修复旧 CDN 缓存中的 OpenRouter 模型目录逻辑。
 * 正式 ai.js 更新后仍可安全保留：仅在 OpenRouter 无 Key 时接管公开目录读取。
 */
(function () {
  'use strict';
  const AI = window.AI;
  if (!AI || typeof AI.listModels !== 'function') return;
  const originalListModels = AI.listModels;
  const cleanBase = value => String(value || '').trim().replace(/\/(?:chat\/completions|responses|messages|models)\/?$/i, '').replace(/\/+$/, '');
  const modelType = item => {
    const value = item || {};
    const architecture = value.architecture && typeof value.architecture === 'object' ? value.architecture : {};
    const modalities = [].concat(architecture.output_modalities || [], value.output_modalities || []).join(' ').toLowerCase();
    const id = String(value.id || value.name || '').toLowerCase();
    if (/image|vision|图像/.test(modalities + ' ' + id)) return 'image';
    if (/audio|speech|语音/.test(modalities + ' ' + id)) return 'audio';
    if (/video|视频/.test(modalities + ' ' + id)) return 'video';
    if (/embedding|embed|向量/.test(modalities + ' ' + id)) return 'embedding';
    return String(value.model_type || value.type || 'text');
  };
  AI.listModels = async function (input) {
    const value = input || {};
    if (value.provider !== 'openrouter' || value.apiKey) return originalListModels(value);
    const base = cleanBase(value.baseUrl || value.endpoint || 'https://openrouter.ai/api/v1');
    if (!/^https:\/\//i.test(base)) return { ok: false, models: [], message: '请先填写有效的 OpenRouter Base URL' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(base + '/models', {
        headers: { Accept: 'application/json', 'HTTP-Referer': window.location.origin, 'X-Title': '凤凰花·智学' },
        signal: controller.signal
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('模型目录返回 HTTP ' + response.status);
      const raw = Array.isArray(payload) ? payload : (Array.isArray(payload.data) ? payload.data : []);
      return {
        ok: true,
        models: raw.map(item => ({
          id: String(item.id || item.name || ''), name: String(item.name || item.id || ''), type: modelType(item),
          pricing: item.pricing || null, contextLength: Number(item.context_length || item.contextLength || 0) || null,
          capabilities: item.supported_parameters || item.capabilities || []
        })).filter(item => item.id).slice(0, 500),
        message: 'OpenRouter 模型目录已公开读取'
      };
    } catch (error) {
      const message = error && error.name === 'AbortError' ? '读取 OpenRouter 模型目录超时，请检查网络状态。' : String(error && error.message || '读取 OpenRouter 模型目录失败');
      return { ok: false, models: [], message };
    } finally {
      clearTimeout(timer);
    }
  };
  AI.listModels.__fhLocalHotfix = true;
})();
