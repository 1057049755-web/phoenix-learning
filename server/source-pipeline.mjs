/* 公开资料采集边界
 * 只允许采集公开 HTTPS 页面；不处理登录、付费墙、验证码、绕过 robots.txt 或访问控制。
 * 该模块只做正文提取与来源记录，不把网页内容当成系统指令。
 */

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_TEXT = 600000;
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function decodeHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Math.min(Number(code) || 0, 0x10ffff)));
}

export function validatePublicUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:') return { ok: false, code: 'HTTPS_REQUIRED', message: '资料来源必须使用 HTTPS 地址' };
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) return { ok: false, code: 'PRIVATE_HOST_BLOCKED', message: '资料来源地址不可访问本地或内网主机' };
    if (/^(10|127)\.|^(192\.168)\.|^(172\.(1[6-9]|2\d|3[01]))\./.test(hostname)) return { ok: false, code: 'PRIVATE_HOST_BLOCKED', message: '资料来源地址不可访问内网地址' };
    return { ok: true, url };
  } catch {
    return { ok: false, code: 'INVALID_SOURCE_URL', message: '资料来源地址格式不正确' };
  }
}

function extractMeta(html, pattern) {
  const match = String(html || '').match(pattern);
  return match ? decodeHtml(match[1] || match[2] || '').replace(/\s+/g, ' ').trim() : '';
}

export function extractPublicDocument(html, sourceUrl) {
  const raw = String(html || '').slice(0, MAX_BYTES);
  const title = extractMeta(raw, /<title[^>]*>([\s\S]*?)<\/title>/i) || extractMeta(raw, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)/i);
  const description = extractMeta(raw, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i);
  const keywords = extractMeta(raw, /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']*)/i);
  const author = extractMeta(raw, /<meta[^>]+name=["']author["'][^>]+content=["']([^"']*)/i);
  const publishedAt = extractMeta(raw, /<meta[^>]+(?:property|name)=["'](?:article:published_time|date|pubdate)["'][^>]+content=["']([^"']*)/i);
  const canonical = extractMeta(raw, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)/i);
  const body = raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(?:nav|header|footer|aside|form|noscript)\b[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|form|noscript)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|article|section|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const paragraphs = decodeHtml(body).split(/\n+/).map(item => item.replace(/\s+/g, ' ').trim()).filter(item => item.length >= 2);
  const content = paragraphs.join('\n').slice(0, MAX_TEXT).trim();
  return {
    title: title || '未命名公开资料',
    author,
    publishedAt,
    sourceUrl: canonical || sourceUrl,
    summary: description,
    keywords: keywords.split(/[,，、]/).map(item => item.trim()).filter(Boolean).slice(0, 20),
    content,
    completeness: content.length ? Math.min(1, content.length / 1200) : 0,
    metadata: { parser: 'public-html-v1', extractedParagraphs: paragraphs.length, originalUrl: sourceUrl }
  };
}

async function robotsAllows(url, fetchImpl) {
  const robotsUrl = new URL('/robots.txt', url.origin).toString();
  try {
    const response = await fetchImpl(robotsUrl, { method: 'GET', headers: { Accept: 'text/plain' } });
    if (!response.ok) return { allowed: true, checked: false, url: robotsUrl };
    const text = await response.text();
    const rules = String(text || '').split(/\r?\n/).map(line => line.split('#')[0].trim()).filter(Boolean);
    let applies = false;
    let disallow = [];
    for (const line of rules) {
      const pair = line.split(':');
      if (pair.length < 2) continue;
      const key = pair.shift().trim().toLowerCase();
      const value = pair.join(':').trim();
      if (key === 'user-agent') { applies = value === '*' || /phoenix|\*/i.test(value); disallow = []; }
      else if (applies && key === 'disallow' && value) disallow.push(value);
    }
    const pathname = url.pathname || '/';
    const blocked = disallow.some(rule => pathname.startsWith(rule));
    return { allowed: !blocked, checked: true, url: robotsUrl };
  } catch {
    return { allowed: true, checked: false, url: robotsUrl };
  }
}

export async function acquirePublicSource(value, options = {}) {
  const checked = validatePublicUrl(value);
  if (!checked.ok) return { ok: false, code: checked.code, message: checked.message, acquisitionMethod: 'direct' };
  const fetchImpl = options.fetchImpl || fetch;
  const robots = await robotsAllows(checked.url, fetchImpl);
  if (!robots.allowed) return { ok: false, code: 'ROBOTS_DISALLOWED', message: '来源网站的 robots.txt 不允许采集该路径', acquisitionMethod: 'direct', robots };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(Math.max(Number(options.timeoutMs) || 12000, 3000), 30000));
  try {
    const response = await fetchImpl(checked.url.toString(), { method: 'GET', headers: { Accept: 'text/html,application/xhtml+xml,text/plain' }, signal: controller.signal });
    const contentType = String(response.headers && response.headers.get('content-type') || '').toLowerCase();
    if ([401, 402, 403].includes(response.status)) return { ok: false, code: 'ACCESS_RESTRICTED', message: '来源网站要求登录、付费或额外访问权限', acquisitionMethod: 'direct', robots };
    if (!response.ok) return { ok: false, code: 'SOURCE_HTTP_ERROR', message: '来源网站返回 HTTP ' + response.status, acquisitionMethod: 'direct', robots };
    if (contentType && !/(html|xhtml|text\/plain)/.test(contentType)) return { ok: false, code: 'UNSUPPORTED_SOURCE_TYPE', message: '当前入口只接收公开网页正文', acquisitionMethod: 'direct', robots };
    const length = Number(response.headers && response.headers.get('content-length') || 0);
    if (length > MAX_BYTES) return { ok: false, code: 'SOURCE_TOO_LARGE', message: '来源页面超过采集大小限制', acquisitionMethod: 'direct', robots };
    const raw = await response.text();
    if (raw.length > MAX_BYTES) return { ok: false, code: 'SOURCE_TOO_LARGE', message: '来源页面超过采集大小限制', acquisitionMethod: 'direct', robots };
    const document = extractPublicDocument(raw, checked.url.toString());
    if (!document.content) return { ok: false, code: 'CONTENT_NOT_FOUND', message: '未识别出可用正文，请改用官方来源或手动补充', acquisitionMethod: 'direct', robots, metadata: document.metadata };
    return { ok: true, acquisitionMethod: 'direct', robots, copyrightStatus: 'public_source_recorded', ...document };
  } catch (error) {
    return { ok: false, code: error && error.name === 'AbortError' ? 'SOURCE_TIMEOUT' : 'SOURCE_FETCH_FAILED', message: '公开资料采集失败，请改用官方来源或手动补充', acquisitionMethod: 'direct', robots };
  } finally { clearTimeout(timer); }
}

export function createManualSource(input = {}) {
  const title = String(input.title || '').trim().slice(0, 240);
  const content = String(input.content || '').trim().slice(0, MAX_TEXT);
  if (!content) return { ok: false, code: 'CONTENT_REQUIRED', message: '请补充资料正文后再保存' };
  return {
    ok: true,
    title: title || '用户补充资料',
    sourceUrl: String(input.sourceUrl || '').trim().slice(0, 1000),
    content,
    summary: String(input.summary || '').trim().slice(0, 1000),
    keywords: Array.isArray(input.keywords) ? input.keywords.map(item => String(item).trim()).filter(Boolean).slice(0, 20) : [],
    completeness: 1,
    acquisitionMethod: 'manual',
    copyrightStatus: 'user_asserted_rights',
    metadata: { parser: 'manual-source-v1' }
  };
}
