/* 凤凰花·智学官方参考数据客户端
 * 只接收服务端 active 记录；失败时保持空目录，不生成本地章节、卷型或模型名单。
 */
(function () {
  'use strict';

  let catalog = { curriculum: [], knowledgeNodes: [], templates: [], generatedAt: '' };
  let models = { providers: [], models: [], generatedAt: '' };
  let catalogPromise = null;
  let modelPromise = null;

  function safeArray(value) { return Array.isArray(value) ? value : []; }
  function text(value) { return String(value == null ? '' : value).trim(); }
  function subject(value) { return window.FH_DOMAIN && window.FH_DOMAIN.canonicalSubject ? window.FH_DOMAIN.canonicalSubject(value) : text(value); }
  function request(path) {
    const network = window.FHNetwork;
    const url = network && network.url ? network.url(path) : path;
    const headers = network && network.headers ? network.headers() : {};
    return fetch(url, { headers }).then(response => response.ok ? response.json() : null).catch(() => null);
  }
  function bookTerm(book) { return /下册|下/.test(text(book)) ? '下' : /全册|全/.test(text(book)) ? '全' : '上'; }
  function buildTextbooks(payload) {
    const out = {};
    safeArray(payload.curriculum).forEach(version => {
      const code = subject(version.subject);
      if (!code) return;
      const nodes = safeArray(payload.knowledgeNodes).filter(node => node.curriculumVersionId === version.id);
      const term = bookTerm(version.book);
      const chapters = nodes.map(node => {
        let sections = [];
        try { sections = safeArray(JSON.parse(node.source && node.source.sections ? JSON.stringify(node.source.sections) : '[]')); } catch (e) { sections = []; }
        if (!sections.length && node.title) return { name: text(node.title) };
        return { name: text(node.chapter || node.unit || node.title), children: sections.map(name => ({ name: text(name) })).filter(item => item.name) };
      }).filter(item => item.name);
      if (!out[code]) out[code] = { name: code === 'ethics' ? '道德与法治' : (window.FH_DOMAIN.subjects[code] && window.FH_DOMAIN.subjects[code].name) || code, versions: [] };
      const existing = out[code].versions.find(item => item.id === version.id);
      const book = { [term]: chapters };
      if (existing) existing.books[version.grade] = Object.assign(existing.books[version.grade] || {}, book);
      else out[code].versions.push({ id: version.id, name: text(version.version), default: out[code].versions.length === 0, books: { [version.grade]: book }, source: version.source, confidence: version.confidence });
    });
    return out;
  }
  function buildPresets(payload) {
    const out = {};
    safeArray(payload.templates).forEach(template => {
      const code = subject(template.subject);
      if (!code || template.subject === 'all') return;
      const sections = safeArray(template.structure && template.structure.sections);
      if (!sections.length) return;
      if (!out[code]) out[code] = [];
      const structure = template.structure || {};
      out[code].push({
        id: template.id,
        name: text(template.region) + ' ' + text(template.year) + ' 年度卷型',
        region: text(template.region),
        year: text(template.year),
        source: template.source,
        score: Number(structure.score) || null,
        total: Number(structure.score) || null,
        time: Number(structure.minutes || structure.time || structure.examMinutes) || 0,
        officialStructure: structure,
        sections: sections
      });
    });
    return out;
  }
  function applyCatalog(payload) {
    if (!payload || payload.ok !== true) return catalog;
    catalog = { curriculum: safeArray(payload.curriculum), knowledgeNodes: safeArray(payload.knowledgeNodes), templates: safeArray(payload.templates), generatedAt: text(payload.generatedAt) };
    const books = buildTextbooks(catalog);
    Object.keys(books).forEach(code => { window.MOCK.TEXTBOOKS[code] = books[code]; });
    const presets = buildPresets(catalog);
    Object.keys(presets).forEach(code => { window.MOCK.PAPER_PRESETS[code] = presets[code]; });
    try { window.dispatchEvent(new CustomEvent('fh-reference-catalog', { detail: catalog })); } catch (e) {}
    return catalog;
  }
  function loadCatalog(force) {
    if (catalogPromise && !force) return catalogPromise;
    catalogPromise = request('/api/reference/catalog').then(applyCatalog);
    return catalogPromise;
  }
  function loadModels(force) {
    if (modelPromise && !force) return modelPromise;
    modelPromise = request('/api/reference/models').then(payload => {
      if (payload && payload.ok === true) models = { providers: safeArray(payload.providers), models: safeArray(payload.models), generatedAt: text(payload.generatedAt) };
      return models;
    });
    return modelPromise;
  }
  function installModelListBridge() {
    if (!window.AI || typeof window.AI.listModels !== 'function' || window.AI.listModels.__fhRegistryBridge) return;
    const listModels = async function (profile) {
      const slug = text(profile && profile.provider);
      const result = await loadModels(true);
      const registered = result.models.filter(item => !slug || item.providerId === slug || item.canonicalKey.indexOf(slug + ':') === 0);
      if (registered.length) return { ok: true, models: registered.map(item => ({ id: item.providerModelId, name: item.officialName, type: item.modelType, pricing: item.pricing, status: item.status })), message: '已读取官方模型目录；价格与状态来自最近一次服务商同步' };
      return { ok: false, models: [], message: '该服务商暂无可用的官方模型记录，请先同步厂家目录或手动填写模型 ID' };
    };
    listModels.__fhRegistryBridge = true;
    window.AI.listModels = listModels;
    window.AI.modelRegistry = { load: loadModels, get: getModels };
  }
  function getCatalog() { return catalog; }
  function getModels() { return models; }
  window.FH_REFERENCE_DATA = Object.freeze({ loadCatalog, loadModels, getCatalog, getModels, applyCatalog });
  loadCatalog().then(() => { if (window.__router) window.__router(); });
  loadModels().then(installModelListBridge);
})();
