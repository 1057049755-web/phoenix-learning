import assert from 'node:assert/strict';
import { createManualSource, extractPublicDocument, validatePublicUrl } from '../server/source-pipeline.mjs';

assert.equal(validatePublicUrl('http://example.com').code, 'HTTPS_REQUIRED');
assert.equal(validatePublicUrl('https://example.com/article').ok, true);
assert.equal(validatePublicUrl('https://127.0.0.1/private').code, 'PRIVATE_HOST_BLOCKED');
const document = extractPublicDocument('<html><head><title>官方通知</title><meta name="description" content="摘要"></head><body><nav>菜单</nav><article><p>第一段内容。</p><p>第二段内容。</p><script>alert(1)</script></article></body></html>', 'https://example.com/article');
assert.equal(document.title, '官方通知');
assert.match(document.content, /第一段内容/);
assert.doesNotMatch(document.content, /alert/);
assert.equal(createManualSource({ title: '教师资料', content: '用户有权使用的资料正文' }).ok, true);
assert.equal(createManualSource({ title: '空资料', content: '' }).code, 'CONTENT_REQUIRED');
console.log('source-pipeline.test.js passed');
