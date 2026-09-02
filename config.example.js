/*
 * 需要把网页放在独立静态服务器、但数据仍由本机 / 局域网服务提供时：
 * 1. 复制为 config.js；
 * 2. 将下方地址改成启动 server.js 时打印的地址；
 * 3. 在 workbench.html 的 network.js 之前引入 config.js。
 *
 * 不需要跨站接入时保持 apiBase 为空即可，网页会自动使用当前页面的 /api。
 */
window.FH_CONFIG = {
  apiBase: 'http://127.0.0.1:8080',
  token: ''
};
