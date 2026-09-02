/* ================= 凤凰花·智学 数学制图引擎 =================
 * 根据 figure 规格生成可内嵌的 SVG：数轴 / 坐标系 / 一次与二次函数图像 /
 * 三角形（含直角三角形）/ 圆（含垂径）/ 矩形（含折叠）/ 圆柱 / 饼图 / 条形图。
 * 饼图 / 条形图在页面内使用 Chart.js（开源 MIT 协议，GitHub 约 67k stars）渲染为
 * 交互式图表；几何图形使用纯 SVG（离线可用、Word/PDF 导出稳定）。
 * AI 出题时按规格输出 figure 字段；无 figure 时按题干参数实时解析挂图；导出时用 SVG 版本内嵌。
 */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmt(n) {
    n = Number(n);
    if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
    return String(Math.round(n * 100) / 100);
  }

  /* ---------- 数轴 ---------- */
  function numberline(p) {
    p = p || {};
    const min = Number(p.min) || -5, max = Number(p.max) || 5;
    const unit = Number(p.unit) || 20; // px per unit
    const w = 560, h = 110;
    const ox = w / 2;
    const xAt = v => ox + v * unit;
    let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:520px" xmlns="http://www.w3.org/2000/svg">';
    s += '<line x1="16" y1="64" x2="' + (w - 20) + '" y2="64" stroke="#333" stroke-width="1.6"/>';
    s += '<path d="M' + (w - 20) + ' 64 l-9 -5 v10 z" fill="#333"/>';
    for (let v = Math.ceil(min); v <= Math.floor(max); v++) {
      const x = xAt(v);
      const isO = v === 0;
      s += '<line x1="' + x + '" y1="58" x2="' + x + '" y2="70" stroke="#333" stroke-width="1.4"/>';
      s += '<text x="' + x + '" y="' + (isO ? 90 : 86) + '" font-size="12" text-anchor="middle" fill="' + (isO ? '#9B1C1C' : '#444') + '">' + fmt(v) + '</text>';
      if (isO) s += '<text x="' + x + '" y="48" font-size="11" text-anchor="middle" fill="#666">O</text>';
    }
    (p.points || []).forEach(pt => {
      const x = xAt(Number(pt.at) || 0);
      s += '<circle cx="' + x + '" cy="64" r="4.5" fill="#2E74B5"/>';
      s += '<text x="' + x + '" y="42" font-size="12" text-anchor="middle" fill="#2E74B5">' + esc(pt.label || pt.at) + '</text>';
    });
    if (p.mark) {
      const x = xAt(Number(p.mark));
      s += '<line x1="' + x + '" y1="72" x2="' + x + '" y2="96" stroke="#B57A00" stroke-width="1.4" stroke-dasharray="3 3"/>';
      s += '<text x="' + x + '" y="108" font-size="11" text-anchor="middle" fill="#B57A00">' + esc(p.markLabel || p.mark) + '</text>';
    }
    return s + '</svg>';
  }

  /* ---------- 坐标系 ---------- */
  function axis(p) {
    p = p || {};
    const w = 420, h = 360, ox = w / 2, oy = h / 2, unit = 30;
    const xAt = v => ox + v * unit, yAt = v => oy - v * unit;
    let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:380px" xmlns="http://www.w3.org/2000/svg">';
    for (let v = -5; v <= 5; v++) {
      s += '<line x1="' + xAt(v) + '" y1="10" x2="' + xAt(v) + '" y2="' + (h - 10) + '" stroke="#E4E9F0" stroke-width="1"/>';
      s += '<line x1="10" y1="' + yAt(v) + '" x2="' + (w - 10) + '" y2="' + yAt(v) + '" stroke="#E4E9F0" stroke-width="1"/>';
    }
    s += '<line x1="12" y1="' + oy + '" x2="' + (w - 12) + '" y2="' + oy + '" stroke="#333" stroke-width="1.6"/>';
    s += '<path d="M' + (w - 12) + ' ' + oy + ' l-9 -5 v10 z" fill="#333"/>';
    s += '<line x1="' + ox + '" y1="' + (h - 12) + '" x2="' + ox + '" y2="12" stroke="#333" stroke-width="1.6"/>';
    s += '<path d="M' + ox + ' 12 l-5 9 h10 z" fill="#333"/>';
    s += '<text x="' + (w - 16) + '" y="' + (oy - 8) + '" font-size="12" fill="#444">x</text>';
    s += '<text x="' + (ox + 8) + '" y="18" font-size="12" fill="#444">y</text>';
    s += '<text x="' + (ox - 6) + '" y="' + (oy + 16) + '" font-size="12" fill="#444">O</text>';
    (p.points || []).forEach(pt => {
      const x = xAt(Number(pt.x) || 0), y = yAt(Number(pt.y) || 0);
      s += '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + esc(pt.color || '#2E74B5') + '"/>';
      s += '<text x="' + (x + (pt.dx || 7)) + '" y="' + (y + (pt.dy || -7)) + '" font-size="12" fill="' + esc(pt.color || '#2E74B5') + '">' + esc(pt.label || ('(' + pt.x + ',' + pt.y + ')')) + '</text>';
    });
    if (p.curve) {
      const path = curvePath(p.curve, xAt, yAt, w, h);
      s += '<path d="' + path.d + '" fill="none" stroke="' + esc(p.curve.color || '#2E74B5') + '" stroke-width="2.2"/>';
      if (path.label) s += '<text x="' + path.label.x + '" y="' + path.label.y + '" font-size="12" fill="' + esc(p.curve.color || '#2E74B5') + '">' + esc(path.label.text) + '</text>';
    }
    return s + '</svg>';
  }

  function curvePath(c, xAt, yAt, w, h) {
    const kind = c.kind || 'parabola';
    const a = Number(c.a) || 1, b = Number(c.b) || 0, cc = Number(c.c) || 0;
    const k = Number(c.k) || 0, bb = Number(c.b2) || 0;
    let f;
    if (kind === 'line') f = x => k * x + bb;
    else f = x => a * x * x + b * x + cc;
    let d = '', started = false, last = null;
    for (let i = 0; i <= 240; i++) {
      const x = -6 + i * 12 / 240;
      const y = f(x);
      if (Math.abs(y) > 20) { started = false; continue; }
      const px = xAt(x), py = yAt(y);
      if (!started) { d += 'M' + px + ' ' + py; started = true; }
      else d += ' L' + px + ' ' + py;
      last = { x: px, y: py };
    }
    return { d: d, label: last ? { x: last.x - 40, y: last.y - 10, text: c.label || '' } : null };
  }

  /* ---------- 几何图形 ---------- */
  function triangle(p) {
    p = p || {};
    const pts = (p.points || [0, 0, 6, 0, 1, 4]).map(Number);
    const w = 340, h = 280, scl = 32, ox = 40, oy = 230;
    const P = [[pts[0], pts[1]], [pts[2], pts[3]], [pts[4], pts[5]]].map(q => [ox + q[0] * scl, oy - q[1] * scl]);
    const labels = p.labels || ['A', 'B', 'C'];
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:300px" xmlns="http://www.w3.org/2000/svg">';
    svg += '<polygon points="' + P.map(q => q[0] + ',' + q[1]).join(' ') + '" fill="' + esc(p.fill || '#EAF2FB') + '" stroke="#2E74B5" stroke-width="2"/>';
    P.forEach((q, i) => {
      svg += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.5" fill="#2E74B5"/>';
      svg += '<text x="' + (q[0] + (p.labelDx && p.labelDx[i] || (i === 1 ? 6 : -8))) + '" y="' + (q[1] + (p.labelDy && p.labelDy[i] || (i === 2 ? 16 : -6))) + '" font-size="13" fill="#0B2545">' + esc(labels[i]) + '</text>';
    });
    (p.sideLabels || []).forEach(sl => {
      const mid = P[sl.from].map((v, k) => (v + P[sl.to][k]) / 2);
      svg += '<text x="' + mid[0] + '" y="' + (mid[1] - 6) + '" font-size="12" fill="#555" text-anchor="middle">' + esc(sl.text) + '</text>';
    });
    if (p.right) {
      // 直角标记
      const a = P[0], b = P[1], c = P[2];
      const v1 = [b[0] - a[0], b[1] - a[1]], v2 = [c[0] - a[0], c[1] - a[1]];
      const L = 14;
      const n1 = L / Math.hypot(v1[0], v1[1]), n2 = L / Math.hypot(v2[0], v2[1]);
      svg += '<path d="M' + (a[0] + v1[0] * n1) + ' ' + (a[1] + v1[1] * n1) +
        ' L' + (a[0] + v1[0] * n1 + v2[0] * n2) + ' ' + (a[1] + v1[1] * n1 + v2[1] * n2) +
        ' L' + (a[0] + v2[0] * n2) + ' ' + (a[1] + v2[1] * n2) + '" fill="none" stroke="#9B1C1C" stroke-width="1.4"/>';
    }
    return svg + '</svg>';
  }

  function circleFig(p) {
    p = p || {};
    const w = 340, h = 320, ox = w / 2, oy = h / 2, r = Number(p.r) || 100;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:300px" xmlns="http://www.w3.org/2000/svg">';
    svg += '<circle cx="' + ox + '" cy="' + oy + '" r="' + r + '" fill="' + esc(p.fill || 'none') + '" stroke="#2E74B5" stroke-width="2"/>';
    svg += '<circle cx="' + ox + '" cy="' + oy + '" r="3" fill="#0B2545"/>';
    svg += '<text x="' + (ox + 6) + '" y="' + (oy - 6) + '" font-size="13" fill="#0B2545">O</text>';
    if (p.diameter) {
      const pts = p.diameter; // [[x1,y1],[x2,y2]] 单位坐标
      const P = pts.map(q => [ox + q[0] * r, oy - q[1] * r]);
      svg += '<line x1="' + P[0][0] + '" y1="' + P[0][1] + '" x2="' + P[1][0] + '" y2="' + P[1][1] + '" stroke="#0B2545" stroke-width="1.8"/>';
      P.forEach((q, i) => { svg += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3" fill="#9B1C1C"/><text x="' + (q[0] + (i ? 6 : -12)) + '" y="' + (q[1] - 6) + '" font-size="13" fill="#9B1C1C">' + esc((p.labels || ['A', 'B'])[i]) + '</text>'; });
    }
    if (p.chord) {
      // 垂直于直径的弦 CD
      const d = Number(p.d) || 0.6; // C、D 的 y 坐标（单位）
      const xc = Math.sqrt(1 - d * d);
      const C = [ox - xc * r, oy - d * r], D = [ox + xc * r, oy - d * r];
      svg += '<line x1="' + C[0] + '" y1="' + C[1] + '" x2="' + D[0] + '" y2="' + D[1] + '" stroke="#B57A00" stroke-width="2"/>';
      svg += '<circle cx="' + C[0] + '" cy="' + C[1] + '" r="3" fill="#B57A00"/><circle cx="' + D[0] + '" cy="' + D[1] + '" r="3" fill="#B57A00"/>';
      svg += '<text x="' + (C[0] - 8) + '" y="' + (C[1] - 6) + '" font-size="13" fill="#B57A00">C</text>';
      svg += '<text x="' + (D[0] + 8) + '" y="' + (D[1] - 6) + '" font-size="13" fill="#B57A00">D</text>';
      const E = [ox, oy - d * r];
      svg += '<circle cx="' + E[0] + '" cy="' + E[1] + '" r="3" fill="#2E7D5B"/><text x="' + (E[0] + 8) + '" y="' + (E[1] - 6) + '" font-size="13" fill="#2E7D5B">E</text>';
    }
    if (p.radius) {
      const a = Number(p.radius.a) || 0.9, b = Number(p.radius.b) || 0.4;
      const R = [ox + a * r, oy - b * r];
      svg += '<line x1="' + ox + '" y1="' + oy + '" x2="' + R[0] + '" y2="' + R[1] + '" stroke="#2E7D5B" stroke-width="1.6"/>';
      svg += '<text x="' + ((ox + R[0]) / 2 + 4) + '" y="' + ((oy + R[1]) / 2 - 6) + '" font-size="12" fill="#2E7D5B">' + esc(p.radius.label || 'r') + '</text>';
    }
    return svg + '</svg>';
  }

  function rectFig(p) {
    p = p || {};
    const w = 340, h = 300, ox = 30, oy = 40;
    const bw = Number(p.w) || 200, bh = Number(p.h) || 140;
    const labels = p.labels || ['A', 'B', 'C', 'D'];
    const P = [[ox, oy], [ox + bw, oy], [ox + bw, oy + bh], [ox, oy + bh]];
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:300px" xmlns="http://www.w3.org/2000/svg">';
    svg += '<rect x="' + ox + '" y="' + oy + '" width="' + bw + '" height="' + bh + '" fill="' + esc(p.fill || '#EAF2FB') + '" stroke="#2E74B5" stroke-width="2"/>';
    P.forEach((q, i) => {
      svg += '<text x="' + (q[0] + (i === 1 ? 4 : i === 2 ? 4 : -10)) + '" y="' + (q[1] + (i < 2 ? -6 : 16)) + '" font-size="13" fill="#0B2545">' + esc(labels[i]) + '</text>';
    });
    if (p.sideLabels) {
      p.sideLabels.forEach(sl => {
        const mid = P[sl.from].map((v, k) => (v + P[sl.to][k]) / 2);
        svg += '<text x="' + (mid[0] + (sl.v ? -8 : 0)) + '" y="' + (mid[1] + (sl.v ? 4 : -8)) + '" font-size="12" fill="#555" text-anchor="middle">' + esc(sl.text) + '</text>';
      });
    }
    if (p.fold) {
      const fx = Number(p.fold) || 0.5;
      const fpx = ox + bw * fx;
      svg += '<line x1="' + fpx + '" y1="' + oy + '" x2="' + fpx + '" y2="' + (oy + bh) + '" stroke="#9B1C1C" stroke-width="1.8" stroke-dasharray="6 4"/>';
      svg += '<text x="' + (fpx + 4) + '" y="' + (oy + bh + 16) + '" font-size="12" fill="#9B1C1C">' + esc(p.foldLabel || '折叠线 AE') + '</text>';
    }
    return svg + '</svg>';
  }

  function cylinderFig(p) {
    p = p || {};
    const w = 260, h = 300, r = Number(p.r) || 60, hh = Number(p.h) || 150;
    const ox = w / 2, top = 60;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:220px" xmlns="http://www.w3.org/2000/svg">';
    svg += '<ellipse cx="' + ox + '" cy="' + top + '" rx="' + r + '" ry="26" fill="#EAF2FB" stroke="#2E74B5" stroke-width="2"/>';
    svg += '<path d="M' + (ox - r) + ' ' + top + ' L' + (ox - r) + ' ' + (top + hh) + ' A' + r + ' 26 0 0 0 ' + (ox + r) + ' ' + (top + hh) + ' L' + (ox + r) + ' ' + top + '" fill="#F4F8FC" stroke="#2E74B5" stroke-width="2"/>';
    svg += '<ellipse cx="' + ox + '" cy="' + (top + hh) + '" rx="' + r + '" ry="26" fill="#EAF2FB" stroke="#2E74B5" stroke-width="2"/>';
    svg += '<text x="' + (ox - r - 8) + '" y="' + (top + hh / 2) + '" font-size="13" fill="#0B2545">h</text>';
    svg += '<text x="' + (ox + 8) + '" y="' + (top + 20) + '" font-size="13" fill="#0B2545">r</text>';
    svg += '<text x="' + (ox - r) + '" y="' + (top - 8) + '" font-size="12" fill="#555">' + esc(p.label || '') + '</text>';
    return svg + '</svg>';
  }

  function pieFig(p) {
    p = p || {};
    const w = 320, h = 260, ox = 130, oy = 130, r = 90;
    const data = p.data || [{ label: '甲', value: 40, color: '#2E74B5' }, { label: '乙', value: 35, color: '#2E7D5B' }, { label: '丙', value: 25, color: '#B57A00' }];
    const total = data.reduce((s, d) => s + Number(d.value), 0) || 1;
    let ang = -90;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:280px" xmlns="http://www.w3.org/2000/svg">';
    data.forEach(d => {
      const frac = Number(d.value) / total;
      const a2 = ang + frac * 360;
      const rad = a => (a - 90) * Math.PI / 180;
      const x1 = ox + r * Math.cos(rad(ang)), y1 = oy + r * Math.sin(rad(ang));
      const x2 = ox + r * Math.cos(rad(a2)), y2 = oy + r * Math.sin(rad(a2));
      const large = frac > 0.5 ? 1 : 0;
      svg += '<path d="M' + ox + ' ' + oy + ' L' + x1 + ' ' + y1 + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' Z" fill="' + esc(d.color) + '"/>';
      const mid = (ang + a2) / 2 * Math.PI / 180;
      const lx = ox + r * 0.62 * Math.cos(mid), ly = oy + r * 0.62 * Math.sin(mid);
      svg += '<text x="' + lx + '" y="' + ly + '" font-size="12" fill="#fff" text-anchor="middle">' + esc(d.label + ' ' + Math.round(frac * 100) + '%') + '</text>';
      ang = a2;
    });
    return svg + '</svg>';
  }

  function barFig(p) {
    p = p || {};
    const data = p.data || [{ label: '一', value: 72 }, { label: '二', value: 80 }, { label: '三', value: 65 }, { label: '四', value: 88 }];
    const w = 360, h = 260, oy = 220, bw = 44, gap = 30, x0 = 40, maxV = Math.max.apply(null, data.map(d => Number(d.value))) || 100;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" style="max-width:320px" xmlns="http://www.w3.org/2000/svg">';
    svg += '<line x1="' + x0 + '" y1="10" x2="' + x0 + '" y2="' + oy + '" stroke="#333" stroke-width="1.4"/>';
    svg += '<line x1="' + x0 + '" y1="' + oy + '" x2="' + (w - 10) + '" y2="' + oy + '" stroke="#333" stroke-width="1.4"/>';
    data.forEach((d, i) => {
      const hh = Number(d.value) / maxV * 180;
      const x = x0 + 12 + i * (bw + gap);
      svg += '<rect x="' + x + '" y="' + (oy - hh) + '" width="' + bw + '" height="' + hh + '" fill="' + esc(d.color || '#2E74B5') + '" rx="3"/>';
      svg += '<text x="' + (x + bw / 2) + '" y="' + (oy - hh - 5) + '" font-size="11" fill="#333" text-anchor="middle">' + d.value + '</text>';
      svg += '<text x="' + (x + bw / 2) + '" y="' + (oy + 16) + '" font-size="11" fill="#555" text-anchor="middle">' + esc(d.label) + '</text>';
    });
    return svg + '</svg>';
  }

  function figureSVG(fig) {
    if (!fig || !fig.type) return '';
    try {
      switch (fig.type) {
        case 'numberline': return numberline(fig);
        case 'axis': return axis(fig);
        case 'triangle': return triangle(fig);
        case 'circle': return circleFig(fig);
        case 'rect': return rectFig(fig);
        case 'cylinder': return cylinderFig(fig);
        case 'pie': return pieFig(fig);
        case 'bar': return barFig(fig);
        default: return '';
      }
    } catch (e) { return ''; }
  }

  /* 常用图形规格 */
  const PRESETS = {
    numline2: { type: 'numberline', min: -5, max: 5, points: [{ at: -2, label: '-2' }] },
    parabola_xx: { type: 'axis', points: [{ x: 1, y: 0, label: 'A(1,0)' }, { x: 3, y: 0, label: 'B(3,0)' }, { x: 0, y: 3, label: 'C(0,3)' }, { x: 2, y: -1, label: '顶点(2,-1)' }], curve: { kind: 'parabola', a: 1, b: -4, c: 3, label: 'y=x²-4x+3' } },
    parabola_press: { type: 'axis', points: [{ x: -1, y: 0, label: 'A(-1,0)' }, { x: 3, y: 0, label: 'B(3,0)' }, { x: 0, y: 3, label: 'C(0,3)' }, { x: 1, y: 4, label: 'P(1,2)' }], curve: { kind: 'parabola', a: -1, b: 2, c: 3, color: '#2E74B5', label: 'y=-x²+2x+3' } },
    parabola_vertex: { type: 'axis', points: [{ x: 1, y: 2, label: '顶点(1,2)' }], curve: { kind: 'parabola', a: 1, b: -2, c: 3, color: '#2E74B5', label: 'y=(x-1)²+2' } },
    line_xy: { type: 'axis', curve: { kind: 'line', k: 2, b2: 1, label: 'y=2x+1' } },
    rt_6_8: { type: 'triangle', points: [0, 0, 6, 0, 0, 8], labels: ['A', 'B', 'C'], right: true, sideLabels: [{ from: 0, to: 1, text: '6' }, { from: 0, to: 2, text: '8' }, { from: 1, to: 2, text: '10' }] },
    circle_8: { type: 'circle', r: 100, diameter: [[-1, 0], [1, 0]], chord: { d: 0.6 }, labels: ['A', 'B'] },
    circle_r3: { type: 'circle', r: 110, radius: { a: 0.9, b: 0.4, label: 'r=3' } },
    rect_fold: { type: 'rect', w: 210, h: 150, labels: ['A', 'B', 'C', 'D'], fold: 0.5, foldLabel: '折叠线 AE', sideLabels: [{ from: 1, to: 2, text: '8' }, { from: 0, to: 1, text: '10' }] },
    rect_12_8: { type: 'rect', w: 240, h: 160, labels: ['A', 'B', 'C', 'D'], sideLabels: [{ from: 0, to: 1, text: '12 厘米' }, { from: 1, to: 2, text: '8 厘米' }] },
    cylinder: { type: 'cylinder', r: 62, h: 150, label: 'r=10cm, h=20cm' },
    pie_math: { type: 'pie', data: [{ label: '选择', value: 40, color: '#2E74B5' }, { label: '填空', value: 30, color: '#2E7D5B' }, { label: '解答', value: 30, color: '#B57A00' }] },
    bar_week: { type: 'bar', data: [{ label: '周一', value: 72, color: '#2E74B5' }, { label: '周二', value: 80, color: '#2E7D5B' }, { label: '周三', value: 65, color: '#B57A00' }, { label: '周四', value: 88, color: '#6B5CA5' }] }
  };

  /* ---------- 页面渲染：饼图/条形图用 Chart.js canvas，其余用 SVG ---------- */
  let chartSeq = 0;

  function figureHTML(fig) {
    if (!fig || !fig.type) return '';
    if (fig.type === 'pie' || fig.type === 'bar') {
      chartSeq++;
      const id = 'fh-chart-' + chartSeq;
      return '<div class="q-figure">' +
        '<canvas id="' + id + '" data-chart="' + esc(fig.type) + '" data-fig="' + esc(JSON.stringify(fig)) + '"></canvas>' +
        '</div>';
    }
    const svg = figureSVG(fig);
    if (!svg) return '';
    return '<div class="q-figure">' + svg + '</div>';
  }

  /* 渲染容器内的 Chart.js 图表（图表卡片 / 编辑替换后需重新调用） */
  function initCharts(root) {
    if (!root || !root.querySelectorAll) return;
    if (typeof Chart === 'undefined') return;
    root.querySelectorAll('canvas[data-chart]').forEach(canvas => {
      if (canvas.__fhChart) return;
      let fig = null;
      try { fig = JSON.parse(canvas.dataset.fig || '{}'); } catch (e) { fig = null; }
      if (!fig || !fig.type) return;
      const data = Array.isArray(fig.data) ? fig.data : [];
      let chart = null;
      if (fig.type === 'pie' && data.length) {
        chart = new Chart(canvas, {
          type: 'pie',
          data: {
            labels: data.map(d => d.label || ''),
            datasets: [{
              data: data.map(d => Number(d.value) || 0),
              backgroundColor: data.map(d => d.color || '#2E74B5')
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { size: 12 } } } }
          }
        });
      } else if (fig.type === 'bar' && data.length) {
        chart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: data.map(d => d.label || ''),
            datasets: [{
              data: data.map(d => Number(d.value) || 0),
              backgroundColor: data.map(d => d.color || '#2E74B5'),
              borderRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }
        });
      }
      if (chart) canvas.__fhChart = chart;
    });
  }

  window.MathPlot = {
    figureSVG: figureSVG,
    figureHTML: figureHTML,
    initCharts: initCharts,
    PRESETS: PRESETS
  };
})();
