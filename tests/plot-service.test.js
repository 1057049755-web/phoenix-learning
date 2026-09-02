import assert from 'node:assert/strict';
import { validatePlotPayload, validateSvg } from '../server/plot-service.mjs';

const safe = '<svg xmlns="http://www.w3.org/2000/svg" aria-label="一次函数图像"><title>一次函数</title><path id="line-a" d="M0 0 L10 10" stroke="black"/></svg>';
assert.equal(validateSvg(safe).ok, true);
assert.equal(validateSvg('<svg><script>alert(1)</script></svg>').ok, false);
assert.equal(validatePlotPayload({ skillKey: 'function-graph', description: { type: 'explicit' }, svgText: safe, accessibilityText: '坐标轴和函数线的文字说明' }).ok, true);
assert.equal(validatePlotPayload({ skillKey: 'unknown', description: {}, svgText: safe, accessibilityText: '' }).ok, false);
console.log('plot-service.test.js passed');
