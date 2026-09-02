# Phoenix Learning

凤凰花·智学的独立网页版本，使用 GitHub Pages 发布，不依赖 GPT Sites。

## 在线运行

GitHub Pages 只负责托管网页前端。当前静态版默认使用浏览器本地数据；需要多端共享数据时，将网络接入指向独立部署的 Node 服务即可。

## 本地运行

如果只查看页面，可以直接打开 `index.html`。如果需要登录、数据同步和 AI 服务检测，建议在项目外接入独立 API 服务，再从网页的“网络接入”配置服务地址。

## 数据与密钥

- GitHub Pages 版本不包含账号数据、服务端 `.env` 或 API Key。
- AI 连接支持服务端中转和浏览器直连；生产环境建议将密钥保存在独立服务端环境变量中。
- 浏览器本地数据不会自动上传到 GitHub。

## 部署方式

推送到 `main` 分支后，`.github/workflows/pages.yml` 会自动通过 GitHub Pages 发布静态文件。
