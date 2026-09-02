/* 受限制图结果校验器
 * 服务端只接受可审计的 SVG 结果，不执行模型生成的任意系统代码。
 * 若以后接入绘图执行器，必须放在独立沙箱中并使用允许库、超时与资源上限。
 */

const MAX_SVG = 2 * 1024 * 1024;
const SKILL_KEYS = new Set([
  'function-graph', 'plane-geometry', 'solid-space', 'statistical-chart', 'physics-circuit',
  'physics-apparatus', 'chemistry-apparatus', 'biology-structure', 'geography-map',
  'history-timeline', 'plot-quality-review'
]);

const MAX_ELEMENTS = 1000;
const XML_ESCAPE = value => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(-100000, Math.min(100000, parsed)) : fallback;
}

function attr(value) { return XML_ESCAPE(String(value)); }
function paint(value, fallback) {
  const candidate = String(value || fallback || 'none').trim();
  return /^(?:none|black|white|currentcolor|#[0-9a-f]{3,8}|rgba?\([^)]{1,80}\)|url\(#[A-Za-z][A-Za-z0-9_.:-]{0,79}\))$/i.test(candidate) ? candidate : fallback;
}
function safePath(value) {
  const path = String(value || '').trim();
  return /^[MmLlHhVvCcSsQqTtAaZz0-9.\-+,\s]+$/.test(path) && path.length <= 20000 ? path : '';
}

/* 将结构化元素渲染为可复现 SVG。
 * 这里故意不执行 sourceCode，也不接受 HTML、脚本或任意系统命令。
 * 模型只能提供 description.elements，渲染器只认识下列白名单元素。
 */
export function renderVectorSvg(description = {}, options = {}) {
  if (!description || typeof description !== 'object') throw new Error('图形描述必须是对象');
  const elements = Array.isArray(description.elements) ? description.elements : [];
  if (!elements.length) throw new Error('图形描述至少需要一个元素');
  if (elements.length > MAX_ELEMENTS) throw new Error('图形元素数量超过限制');
  const width = number(description.width, 800);
  const height = number(description.height, 500);
  const viewBox = String(description.viewBox || `0 0 ${Math.max(1, width)} ${Math.max(1, height)}`)
    .trim().split(/\s+/).map(item => number(item, 0));
  if (viewBox.length !== 4 || viewBox.some(item => !Number.isFinite(item))) throw new Error('viewBox 格式不正确');
  const title = String(options.title || description.title || '教学图形').slice(0, 240);
  const aria = String(options.accessibilityText || description.accessibilityText || title).slice(0, 2000);
  const common = item => {
    const parts = [];
    if (item.id && /^[A-Za-z][A-Za-z0-9_.:-]{0,79}$/.test(String(item.id))) parts.push(`id="${attr(item.id)}"`);
    if (item.className && /^[A-Za-z0-9 _-]{1,80}$/.test(String(item.className))) parts.push(`class="${attr(item.className)}"`);
    parts.push(`fill="${attr(paint(item.fill, 'none'))}"`, `stroke="${attr(paint(item.stroke, 'black'))}"`, `stroke-width="${number(item.strokeWidth, 2)}"`);
    if (item.dasharray) parts.push(`stroke-dasharray="${attr(String(item.dasharray).slice(0, 80))}"`);
    return parts.join(' ');
  };
  const lines = elements.map(item => {
    if (!item || typeof item !== 'object') return '';
    const c = common(item);
    switch (String(item.type || '').toLowerCase()) {
      case 'line': return `<line ${c} x1="${number(item.x1)}" y1="${number(item.y1)}" x2="${number(item.x2)}" y2="${number(item.y2)}"/>`;
      case 'polyline':
      case 'polygon': {
        const points = String(item.points || '').trim();
        if (!/^[0-9.\-+,\s]+$/.test(points) || points.length > 20000) return '';
        return `<${String(item.type).toLowerCase()} ${c} points="${attr(points)}"/>`;
      }
      case 'circle': return `<circle ${c} cx="${number(item.cx)}" cy="${number(item.cy)}" r="${Math.max(0, number(item.r))}"/>`;
      case 'rect': return `<rect ${c} x="${number(item.x)}" y="${number(item.y)}" width="${Math.max(0, number(item.width))}" height="${Math.max(0, number(item.height))}" rx="${Math.max(0, number(item.rx))}"/>`;
      case 'path': {
        const d = safePath(item.d);
        return d ? `<path ${c} d="${attr(d)}"/>` : '';
      }
      case 'text': return `<text ${c} x="${number(item.x)}" y="${number(item.y)}" font-size="${Math.max(8, Math.min(96, number(item.fontSize, 18)))}">${XML_ESCAPE(String(item.text || '').slice(0, 500))}</text>`;
      default: return '';
    }
  });
  if (lines.some((line, index) => !line && elements[index] && typeof elements[index] === 'object')) throw new Error('图形描述包含不支持或不安全的元素');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(1, width)}" height="${Math.max(1, height)}" viewBox="${viewBox.join(' ')}" role="img" aria-label="${XML_ESCAPE(aria)}"><title>${XML_ESCAPE(title)}</title>${lines.join('')}</svg>`;
}

export function validateSvg(svg) {
  const value = String(svg || '').trim();
  const errors = [];
  if (!value) errors.push('SVG 结果为空');
  if (value.length > MAX_SVG) errors.push('SVG 结果超过大小限制');
  if (!/^<svg\b[^>]*>[\s\S]*<\/svg>$/i.test(value)) errors.push('结果必须是完整 SVG 文档');
  if (/<\s*script\b|javascript\s*:|\son[a-z]+\s*=|<(?:iframe|object|embed)\b/i.test(value)) errors.push('SVG 包含脚本、事件处理器或外部嵌入');
  if (/(?:href|xlink:href)\s*=\s*["'](?:https?:|data:text\/html|javascript:)/i.test(value)) errors.push('SVG 不得加载外部页面或脚本');
  const ids = [];
  value.replace(/\bid\s*=\s*["']([^"']+)["']/gi, (_, id) => { ids.push(id); return _; });
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push('图形元素 ID 必须唯一');
  const hasAccessibleName = /(?:aria-label|aria-labelledby|<title\b)/i.test(value);
  if (!hasAccessibleName) errors.push('图形缺少无障碍标题或说明');
  const colors = new Set();
  value.replace(/(?:fill|stroke|color)\s*=\s*["']([^"']+)["']/gi, (_, color) => { colors.add(color.toLowerCase()); return _; });
  const blackWhiteSafe = colors.size === 0 || Array.from(colors).every(color => /^(none|black|white|#(?:000|000000|fff|ffffff)|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\)|rgb\(\s*255\s*,\s*255\s*,\s*255\s*|currentcolor)$/i.test(color));
  return { ok: errors.length === 0, errors, size: value.length, elementIds: Array.from(new Set(ids)), blackWhite: { safe: blackWhiteSafe, colorCount: colors.size } };
}

export function validatePlotPayload(input = {}) {
  const skillKey = String(input.skillKey || '').trim();
  const errors = [];
  if (!SKILL_KEYS.has(skillKey)) errors.push('制图 Skill 不在允许目录中');
  if (!input.description || typeof input.description !== 'object') errors.push('缺少结构化图形描述');
  const svg = validateSvg(input.svgText || input.svg || '');
  if (!svg.ok) errors.push(...svg.errors);
  const accessibilityText = String(input.accessibilityText || '').trim();
  if (!accessibilityText) errors.push('缺少面向学生的图形文字说明');
  return { ok: errors.length === 0, errors, skillKey, svg, accessibilityText: accessibilityText.slice(0, 2000), executor: { mode: 'sandbox-required', arbitraryCode: false } };
}

export function plotArtifactRecord(input = {}, validation = validatePlotPayload(input)) {
  return {
    skillKey: String(input.skillKey || '').trim(),
    description: input.description && typeof input.description === 'object' ? input.description : {},
    sourceCode: String(input.sourceCode || '').slice(0, 100000),
    svgText: String(input.svgText || input.svg || '').slice(0, MAX_SVG),
    pngRef: String(input.pngRef || '').slice(0, 1000),
    accessibilityText: String(input.accessibilityText || '').slice(0, 2000),
    blackWhiteCheck: validation.svg.blackWhite,
    validation
  };
}

export const plotSkillKeys = Object.freeze(Array.from(SKILL_KEYS));
