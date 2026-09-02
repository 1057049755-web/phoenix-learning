/*
 * 凤凰花·智学真实文件识别层
 *
 * 运行时接入两个开源项目：
 * - Tesseract.js（Apache-2.0）：浏览器内 WebAssembly OCR
 * - PDF.js（Apache-2.0）：浏览器内 PDF 页面渲染
 *
 * 这里不生成占位答卷：文件无法读取或网络资源不可用时，直接返回错误给教师。
 */
(function () {
  'use strict';

  const SOURCES = {
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    worker: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
    core: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0/tesseract-core.wasm.js',
    lang: 'https://tessdata.projectnaptha.com/4.0.0',
    pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    pdfWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
  };
  const cache = { tesseract: null, pdf: null, worker: null };

  function loadScript(src, key) {
    if (cache[key]) return cache[key];
    cache[key] = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-fh-oss="' + key + '"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('开源组件加载失败：' + key)), { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.dataset.fhOss = key;
      script.onload = () => resolve();
      script.onerror = () => { cache[key] = null; reject(new Error('开源组件加载失败：' + key)); };
      document.head.appendChild(script);
    });
    return cache[key];
  }

  async function ensureTesseract(onProgress) {
    if (!window.Tesseract) await loadScript(SOURCES.tesseract, 'tesseract');
    if (!window.Tesseract || !window.Tesseract.createWorker) throw new Error('OCR 引擎未就绪，请检查网络后重试');
    if (!cache.worker) {
      cache.worker = window.Tesseract.createWorker('chi_sim+eng', 1, {
        workerPath: SOURCES.worker,
        corePath: SOURCES.core,
        langPath: SOURCES.lang,
        logger: message => {
          if (typeof onProgress !== 'function' || !message) return;
          const value = Number(message.progress || 0);
          if (message.status === 'recognizing text') onProgress(Math.round(value * 100), 'OCR 识别文字 ' + Math.round(value * 100) + '%');
          else if (message.status === 'loading language traineddata') onProgress(Math.round(value * 100), '加载中文识别模型 ' + Math.round(value * 100) + '%');
        }
      }).then(async worker => {
        await worker.setParameters({ preserve_interword_spaces: '1' });
        return worker;
      }).catch(error => { cache.worker = null; throw error; });
    }
    return cache.worker;
  }

  async function ensurePdf() {
    if (!window.pdfjsLib) await loadScript(SOURCES.pdf, 'pdf');
    if (!window.pdfjsLib || !window.pdfjsLib.getDocument) throw new Error('PDF 查看器未就绪，请检查网络后重试');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = SOURCES.pdfWorker;
    return window.pdfjsLib;
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('图片无法读取，请更换文件后重试')); };
      image.src = url;
    });
  }

  async function imageCanvas(file) {
    const image = await loadImage(file);
    const maxEdge = 2400;
    const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
    canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async function recognizeCanvas(canvas, onProgress) {
    const worker = await ensureTesseract(onProgress);
    const result = await worker.recognize(canvas);
    const data = result && result.data ? result.data : {};
    const words = (data.words || []).slice(0, 2400).map(word => {
      const box = word.bbox || {};
      return {
        text: String(word.text || ''),
        confidence: Number(word.confidence || 0),
        x: Number(box.x0 || 0) / canvas.width,
        y: Number(box.y0 || 0) / canvas.height,
        w: Math.max(0, Number(box.x1 || 0) - Number(box.x0 || 0)) / canvas.width,
        h: Math.max(0, Number(box.y1 || 0) - Number(box.y0 || 0)) / canvas.height
      };
    }).filter(word => word.text.trim());
    return { text: String(data.text || '').trim(), confidence: Number(data.confidence || 0), words: words };
  }

  function pageRecord(page, recognized, canvas) {
    return {
      page: page,
      text: recognized.text,
      confidence: Math.round(Math.max(0, Math.min(100, recognized.confidence || 0))),
      words: recognized.words,
      preview: canvas.toDataURL('image/jpeg', 0.82),
      width: canvas.width,
      height: canvas.height
    };
  }

  async function processImage(file, onProgress) {
    onProgress && onProgress(5, '正在读取图片…');
    const canvas = await imageCanvas(file);
    onProgress && onProgress(12, '图片已载入，开始 OCR…');
    const recognized = await recognizeCanvas(canvas, progress => onProgress && onProgress(12 + Math.round(progress * 0.86), 'OCR 识别文字 ' + progress + '%'));
    return { kind: 'image', pages: [pageRecord(1, recognized, canvas)] };
  }

  async function processPdf(file, onProgress) {
    const pdfjs = await ensurePdf();
    onProgress && onProgress(5, '正在打开 PDF…');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    if (!pdf.numPages) throw new Error('PDF 没有可读取的页面');
    if (pdf.numPages > 20) throw new Error('单份 PDF 最多识别 20 页，请拆分后再上传');
    const pages = [];
    for (let index = 1; index <= pdf.numPages; index++) {
      const page = await pdf.getPage(index);
      const viewport = page.getViewport({ scale: 1.45 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport: viewport }).promise;
      const base = 8 + Math.round((index - 1) / pdf.numPages * 84);
      onProgress && onProgress(base, '渲染第 ' + index + ' / ' + pdf.numPages + ' 页…');
      const recognized = await recognizeCanvas(canvas, progress => onProgress && onProgress(base + Math.round(progress / pdf.numPages), 'OCR 第 ' + index + ' 页 ' + progress + '%'));
      pages.push(pageRecord(index, recognized, canvas));
    }
    return { kind: 'pdf', pages: pages };
  }

  async function processFile(file, onProgress) {
    if (!file) throw new Error('没有选择文件');
    if (file.size > 25 * 1024 * 1024) throw new Error('单个文件不能超过 25 MB');
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');
    const isImage = /^image\//i.test(file.type) || /\.(png|jpe?g|webp|bmp|gif)$/i.test(file.name || '');
    if (!isPdf && !isImage) throw new Error('仅支持 PDF、PNG、JPG、WEBP、BMP 或 GIF');
    const result = isPdf ? await processPdf(file, onProgress) : await processImage(file, onProgress);
    onProgress && onProgress(100, 'OCR 已完成');
    return {
      kind: result.kind,
      fileName: file.name || '未命名文件',
      mime: file.type || (isPdf ? 'application/pdf' : 'image/*'),
      size: file.size || 0,
      pages: result.pages,
      engine: 'Tesseract.js + PDF.js',
      processedAt: new Date().toISOString()
    };
  }

  window.FH_OCR = { processFile: processFile, sources: SOURCES };
})();
