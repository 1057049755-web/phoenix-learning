/* 结构化制图执行器测试。运行：node tests/vector-renderer.test.js */
'use strict';

const assert = require('node:assert/strict');
(async () => {
  const { renderVectorSvg, validateSvg } = await import('../server/plot-service.mjs');
  const svg = renderVectorSvg({ title: '三角形', width: 300, height: 200, elements: [
    { type: 'polygon', id: 'triangle', points: '20,180 150,20 280,180', stroke: 'black' },
    { type: 'text', id: 'label-a', x: 140, y: 195, text: 'A', fill: 'black' }
  ] }, { accessibilityText: '一个三角形示意图' });
  assert.equal(validateSvg(svg).ok, true);
  assert.match(svg, /aria-label="一个三角形示意图"/);
  assert.throws(() => renderVectorSvg({ elements: [{ type: 'script', text: 'alert(1)' }] }));
  assert.throws(() => renderVectorSvg({ elements: [{ type: 'path', d: 'M0 0 javascript:alert(1)' }] }));
  console.log('vector-renderer tests: passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
