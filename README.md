# 凤凰花·智学网络版

本目录是凤凰花·智学的静态发布产物。当前无可运行后端时，页面支持在本地浏览器保存 AI 连接并直连服务商官方 API；业务数据仍按网络服务是否配置来决定，不内置题目、教材正文、阅读材料、知识点语料或本地 AI 兜底。

## 运行边界

- 账号、班级、课程、作业、试卷、批改和审计数据在接入业务后端时由服务端数据库保存。
- 浏览器只保留当前会话令牌和用户主动保存的 AI 连接配置；业务数据不会写入 localStorage，也不会在无服务时伪造“在线”状态。
- 当前 AI 请求由浏览器按连接配置直连官方 API。API Key 只保存在当前设备的 `localStorage`，不进入业务记录、导出包或工作流日志；服务商必须允许浏览器跨域访问。
- 学生手机号在学生可见范围内始终脱敏；管理员导入账号时由服务端加密保存身份字段。
- 系统不提供家长端、不提供拍照搜题、不收录只能本地部署的模型。

## 发布入口

默认入口为 `index.html`，工作台为 `workbench.html`。正式发布前需要同时确认静态资源版本、Worker 版本、数据库绑定、身份密钥和 AI 服务状态。

## 服务接口

| 接口 | 用途 |
| --- | --- |
| `GET /api/ping` 或 `GET /api/health` | 分别检查服务、数据库和身份状态 |
| `POST /api/auth/login` | 创建网络会话 |
| `POST /api/auth/logout` | 撤销当前会话 |
| `GET /api/auth/me` | 获取当前脱敏账号 |
| `POST /api/auth/activate` | 首次登录设置新密码 |
| `POST /api/auth/change-password` | 修改密码 |
| `POST /api/admin/users` | 管理级或教务级加密导入下级账号 |
| `GET/PUT /api/col/:name` | 访问已鉴权业务集合 |
| `GET /api/ai/status` | 可选后端部署中的 AI 状态接口 |
| `POST /api/ai/chat` | 可选后端部署中的 AI 中转接口；当前静态模式不依赖它 |
| `GET /api/reference/catalog` | 读取已入库的官方教材目录、章节标题和年度卷型 |
| `GET /api/reference/models` | 读取最近一次官方模型目录、价格字段和可用状态 |
| `POST /api/admin/models/sync` | 管理员从服务商官方接口同步模型目录 |
| `GET/POST /api/learning/assignments` | 教师布置作业、学生读取作业 |
| `GET/POST /api/learning/submissions` | 学生保存草稿、补交和正式提交 |
| `GET/POST /api/learning/feedback` | 教师保存反馈、发布学生可见结果 |
| `GET/POST /api/learning/wrongbook` | 保存和读取错题复习条目 |
| `GET/POST /api/learning/notes` | 保存和读取学生笔记 |
| `GET/PATCH /api/learning/notifications/:id` | 学习通知与已读状态 |
| `POST /api/analytics/reports` | 服务器确定性统计与逐科三次作业门槛 |
| `GET/PUT /api/analytics/reports/:id` | 读取报告或保存 AI 解读结果 |
| `GET/POST /api/sources` | 合规公开资料采集或用户手动补充 |
| `POST /api/plots/validate` | 校验结构化 SVG、脚本安全和无障碍信息 |

没有业务后端或没有必要密钥时，业务服务应返回明确的不可用状态，不得回退到示例数据或浏览器存储。AI 连接中心在静态模式下不依赖后端，但需要用户提供可跨域访问的官方 API Key。

## 数据模型

课程层级为：国家课程规则 → 省级实施方案 → 地市/区县规则 → 学校课程方案 → 班级学期开课实例。班级、成员、任课和升迁记录均按学年、学期、有效期和审计信息保存。六三、五四学制与初中综合科学/物化生分科路线由服务端配置。

题目必须保存响应形式、学科任务类型、认知操作和题目结构。AI 试卷在生成完成前建立 `question_manifest`，每个独立题和每个小问都必须具备标准答案、详解、依据和评分点。

## 部署检查

1. 配置唯一生产域名的有效 HTTPS 证书。
2. 配置 D1 数据库、`FH_PII_KEY`、允许来源和服务端 AI 凭据。
3. 禁止空鉴权密钥启动写接口。
4. 检查 `/api/ping`、`/api/health`、`/api/ai/status` 与登录链路。
5. 记录构建版本、提交号和部署时间。

若部署 Cloudflare Workers，模型目录同步可由 Worker 的 `scheduled` 入口执行，并在 D1 中保留运行记录和变更快照。静态模式下，AI 连接中心使用用户 Key 从所选服务商的官方 `/models` 目录读取模型、能力和价格；教材与地区卷型仍由可选业务后端提供。`glm-4-flash-250414` 是浏览器新建连接的默认模型，具体可用性以服务商当次响应为准。
