/* 凤凰花·智学制图 Skills v1
 * 只定义受限绘图任务的契约，不执行模型生成的系统代码，也不保存题目资源。
 */
(function () {
  'use strict';

  const commonOutput = ['description', 'reproducibleCode', 'svg', 'pngRef', 'elements', 'binding', 'blackWhiteCheck', 'accessibilityText', 'validation'];
  const skillList = [
    ['function', '复杂函数图像', ['expression', 'coordinateSystem', 'sampling', 'annotations'], '支持显函数、隐函数、参数方程、极坐标、分段、多函数叠加、不连续点、渐近线、切线、交点、阴影、参数变化和坐标变换；必须自适应取样并同时做符号/数值校验。'],
    ['plane_geometry', '平面几何', ['points', 'segments', 'circles', 'constraints', 'annotations'], '支持点线圆、角度、平行垂直、全等相似、辅助线和证明绑定；图形关系必须由结构化约束表达。'],
    ['solid_space', '立体与空间示意', ['vertices', 'edges', 'faces', 'projection', 'annotations'], '支持空间几何体、截面、投影、遮挡和展开关系；明确可见线与隐藏线。'],
    ['statistics', '统计图表', ['dataset', 'chartType', 'axes', 'labels', 'scale'], '支持条形图、折线图、扇形图、频数分布和综合统计图；刻度、单位、总量和标签必须可计算复核。'],
    ['physics_circuit', '物理电路与光路', ['components', 'connections', 'directions', 'labels'], '支持电路元件、开关、电流方向、光线、法线、焦点和光路方向；连接关系不能只依赖像素位置。'],
    ['physics_experiment', '物理实验装置', ['apparatus', 'connections', 'procedure', 'labels', 'variables'], '用结构化器材和连接描述实验装置，绑定实验步骤、变量控制和安全检查。'],
    ['chemistry_experiment', '化学实验装置', ['apparatus', 'chemicals', 'connections', 'conditions', 'labels'], '校验化学式、反应条件、气路、收集方法、实验安全和装置文字。'],
    ['biology_structure', '生物结构与实验示意', ['structures', 'hierarchy', 'procedure', 'variables', 'labels'], '支持结构图、生命过程和实验流程，检查结构层级、方向、变量和术语一致性。'],
    ['geography_map', '地理地图与剖面图', ['regions', 'coordinates', 'scale', 'legend', 'layers'], '支持区域地图、比例尺、图例、剖面和空间关系；地理位置、方向和统计值必须可追溯。'],
    ['history_timeline', '历史时间轴', ['events', 'dates', 'relations', 'labels'], '支持时间点、时间段、因果/并列关系和史实范围；不生成未被来源证明的事件。'],
    ['figure_quality', '综合图形质量审核', ['svg', 'description', 'questionBinding', 'validationRules'], '检查图文一致、元素完整、标注不重叠、黑白打印、无障碍文本、可复现代码和安全执行结果。']
  ];

  const skills = Object.freeze(skillList.reduce((out, item) => {
    const [key, name, required, responsibility] = item;
    out[key] = Object.freeze({
      key, name, version: 'plot.' + key + '.v1', responsibility,
      inputSchema: { type: 'object', required, additionalProperties: true },
      outputSchema: { type: 'object', required: commonOutput, additionalProperties: false },
      prompt: `任务：生成${name}的结构化图形。约束：只使用允许的矢量绘图 API；所有元素、文字、单位和关系必须来自输入；不补造事实；输出可复现代码和无障碍说明；失败时返回校验错误，不输出任意系统命令。工具：受限绘图执行器、矢量渲染器、黑白预览器、几何/数值校验器。质量：图形与题干绑定、可打印、可复核、无脚本注入。`,
      executor: { type: 'sandboxed_vector_renderer', timeoutMs: 8000, maxOutputBytes: 800000, allowList: ['svg-path', 'svg-shape', 'svg-text', 'math-evaluator', 'numeric-check'] },
      validator: { checks: ['schema', 'safe_svg', 'element_ids_unique', 'question_binding', 'label_overlap', 'black_white', 'accessibility', 'reproducibility'] },
      repair: { maxAttempts: 2, order: ['schema', 'geometry', 'labels', 'contrast', 'accessibility'] },
      fallback: { type: 'structured_error', reason: '绘图执行失败时只显示结构化错误，不伪造图形' },
      tests: { unit: ['required_input', 'safe_svg', 'duplicate_element_id', 'missing_binding'], golden: { description: { skill: key, elements: [] } } },
      history: [{ version: 'plot.' + key + '.v1', date: '2026-09-02', change: '拆分独立制图契约' }]
    });
    return out;
  }, {}));

  function isObject(value) { return !!value && typeof value === 'object' && !Array.isArray(value); }
  function validateInput(skillKey, input) {
    const skill = skills[skillKey];
    if (!skill) return { ok: false, errors: ['未知制图 Skill'] };
    const data = isObject(input) ? input : {};
    const errors = skill.inputSchema.required.filter(field => data[field] == null || data[field] === '').map(field => `缺少 ${field}`);
    return { ok: errors.length === 0, errors, skill: skill.version };
  }

  function validateOutput(skillKey, output) {
    const skill = skills[skillKey];
    const data = isObject(output) ? output : {};
    if (!skill) return { ok: false, errors: ['未知制图 Skill'] };
    const errors = skill.outputSchema.required.filter(field => data[field] == null || data[field] === '').map(field => `缺少 ${field}`);
    const svg = String(data.svg || '');
    if (svg && (!/^\s*<svg[\s>]/i.test(svg) || /<script|javascript:|on[a-z]+\s*=/i.test(svg))) errors.push('SVG 包含非法脚本或格式');
    const ids = Array.from(svg.matchAll(/\sid=["']([^"']+)["']/gi)).map(x => x[1]);
    if (new Set(ids).size !== ids.length) errors.push('图形元素 ID 重复');
    return { ok: errors.length === 0, errors, skill: skill.version };
  }

  function buildRequest(skillKey, input, binding) {
    const check = validateInput(skillKey, input);
    if (!check.ok) return { ok: false, errors: check.errors };
    return { ok: true, skill: skills[skillKey], input: { ...input, binding: binding || input.binding || null }, execution: skills[skillKey].executor };
  }

  window.FH_PLOT_SKILLS = Object.freeze({ version: 'plot-registry.v1', skills, list: () => Object.values(skills), validateInput, validateOutput, buildRequest });
})();
