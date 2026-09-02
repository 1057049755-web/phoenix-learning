# 模型价格与可用状态动态同步（第 7 部分）

日期：2026-09-02

## 设计结果

模型名称、精确版本、能力、上下文、输出上限、价格字段和可用状态不再由页面名单决定。服务商目录保存在 `model_registry_providers`，模型快照保存在 `model_registry_models`，每次变更保存在 `model_registry_history`，同步运行保存在 `model_registry_sync_runs`。

原始厂家、云平台和聚合平台分开记录。2026-09-02 目录已扩展为 21 个官方网络 API 入口，并加入智谱AI（BigModel）。具体模型不写入前端代码，由官方模型列表接口同步后入库；智谱的默认入口为官方文档标注免费的 `glm-4-flash-250414`，价格依据官方定价页记录。

OpenRouter 官方文档说明可以通过 `GET /api/v1/models` 取得模型及属性，并返回上下文长度和 pricing 字段：[模型 API 文档](https://openrouter.ai/docs/api/api-reference/models/get-models)、[模型目录](https://openrouter.ai/models/)。

## 目录入口

| 分类 | 服务商 | 官方模型列表 API | 服务端密钥变量 |
|---|---|---|---|
| 聚合平台 | OpenRouter | `https://openrouter.ai/api/v1/models` | `FH_MODEL_REGISTRY_KEY_OPENROUTER` |
| 原始厂家 | OpenAI | `https://api.openai.com/v1/models` | `FH_MODEL_REGISTRY_KEY_OPENAI` |
| 原始厂家 | Anthropic | `https://api.anthropic.com/v1/models` | `FH_MODEL_REGISTRY_KEY_ANTHROPIC` |
| 原始厂家 | Google AI Studio | `https://generativelanguage.googleapis.com/v1beta/models` | `FH_MODEL_REGISTRY_KEY_GOOGLE_AI_STUDIO` |
| 原始厂家 | DeepSeek | `https://api.deepseek.com/models` | `FH_MODEL_REGISTRY_KEY_DEEPSEEK` |
| 原始厂家 | 智谱AI（BigModel） | `https://open.bigmodel.cn/api/paas/v4/models` | `FH_MODEL_REGISTRY_KEY_ZHIPU` |
| 云平台 | 阿里云百炼 Model Studio | `https://dashscope.aliyuncs.com/api/v1/models` | `FH_MODEL_REGISTRY_KEY_ALIBABA_MODEL_STUDIO` |
| 云平台 | 百度智能云千帆 | `https://qianfan.baidubce.com/v2/models` | `FH_MODEL_REGISTRY_KEY_BAIDU_QIANFAN` |
| 云平台 | 硅基流动 | `https://api.siliconflow.cn/v1/models` | `FH_MODEL_REGISTRY_KEY_SILICONFLOW` |
| 原始厂家 | Mistral AI | `https://api.mistral.ai/v1/models` | `FH_MODEL_REGISTRY_KEY_MISTRAL` |
| 云平台 | GroqCloud | `https://api.groq.com/openai/v1/models` | `FH_MODEL_REGISTRY_KEY_GROQ` |
| 云平台 | Together AI | `https://api.together.xyz/v1/models` | `FH_MODEL_REGISTRY_KEY_TOGETHER` |
| 云平台 | Fireworks AI | `https://api.fireworks.ai/inference/v1/models` | `FH_MODEL_REGISTRY_KEY_FIREWORKS` |
| 原始厂家 | Cohere | `https://api.cohere.com/v1/models` | `FH_MODEL_REGISTRY_KEY_COHERE` |
| 原始厂家 | xAI | `https://api.x.ai/v1/models` | `FH_MODEL_REGISTRY_KEY_XAI` |
| 聚合平台 | Replicate | `https://api.replicate.com/v1/models` | `FH_MODEL_REGISTRY_KEY_REPLICATE` |
| 原始厂家 | Cerebras Inference | `https://api.cerebras.ai/v1/models` | `FH_MODEL_REGISTRY_KEY_CEREBRAS` |
| 云平台 | SambaNova Cloud | `https://api.sambanova.ai/v1/models` | `FH_MODEL_REGISTRY_KEY_SAMBANOVA` |
| 原始厂家 | MiniMax 开放平台 | `https://api.minimaxi.com/v1/models` | `FH_MODEL_REGISTRY_KEY_MINIMAX` |
| 原始厂家 | Perplexity API | `https://api.perplexity.ai/v1/models`；调用 `/v1/agent`（Responses 兼容） | `FH_MODEL_REGISTRY_KEY_PERPLEXITY` |
| 聚合平台 | 腾讯云 TokenHub | `https://tokenhub.tencentmaas.com/v1/models` | `FH_MODEL_REGISTRY_KEY_TENCENT_TOKENHUB` |

官方文档依据包括 [OpenAI Models API](https://platform.openai.com/docs/api-reference/models)、[Anthropic Models API](https://docs.anthropic.com/en/api/models-list)、[Gemini Models API](https://ai.google.dev/api/models)、[DeepSeek Models API](https://api-docs.deepseek.com/api/list-models)、[百度千帆模型列表](https://cloud.baidu.com/doc/qianfan-api/s/Dmba8k71y)、[硅基流动模型列表](https://docs.siliconflow.cn/en/api-reference/models/get-model-list)、[Mistral Models API](https://docs.mistral.ai/api/endpoint/models)、[Groq Models API](https://console.groq.com/docs/models)、[Together Models API](https://docs.together.ai/reference/models)、[Cohere Models API](https://docs.cohere.com/reference/list-models)、[xAI Models API](https://docs.x.ai/developers/rest-api-reference/inference/models)、[Replicate Models API](https://replicate.com/docs/reference/http) 和 [Perplexity Models API](https://docs.perplexity.ai/api-reference/models-get)。

## 同步流程

1. `server/migrations/005_model_catalog_reset_and_directory.sql` 先把旧模型、旧服务商、旧同步记录和对应的 `records` 目录行备份到同库恢复表，再清空目录元数据；`006`、`008` 和 `009` 继续补充可由官方接口同步的服务商入口。
2. 有业务后端时，管理员调用 `POST /api/admin/models/sync`，指定服务商或同步全部已登记服务商；当前静态模式由用户在连接中心使用自己的 Key 直接读取所选服务商的模型目录。
3. 服务端模式从数据库读取官方模型列表地址和服务端环境变量名；浏览器模式不会把 Key 上传到本项目服务端，只把它用于当前设备直连请求。
4. 请求设置超时、响应大小上限、分页上限和最多 5000 条记录；对模型 ID、能力、价格、上下文和版本做结构化归一化。
5. 同一服务商没有出现在新目录的历史模型会标记为 `unavailable`，不物理删除；新目录中的记录标记为 `available`。
6. 价格字段直接保存官方接口返回值。官方模型列表未提供价格时保留其官方来源链接；对智谱默认的 `glm-4-flash-250414`，使用智谱官方定价页明确标注的免费价格覆盖值，并在页面附上定价链接。
7. 通过模型指纹判断变更，发生变化时写入历史快照；同步结果返回模型数量、变更数量、来源哈希和同步时间。

## 接口

- `GET /api/reference/models`：读取可用模型、服务商归类、能力、价格、官方来源和最近同步时间；只读，不返回密钥、原始响应或内部错误详情。
- `GET /api/reference/models?provider=openrouter&type=text`：按聚合平台和能力过滤。
- `POST /api/admin/models/sync`：管理员手动同步，适合由外部 Cron 每日调用。
- AI 连接中心提供“从官方读取”入口；浏览器直接请求所选服务商的模型目录，读取成功后在当前连接中展示模型、价格与能力。服务商不允许跨域时，页面保留手动填写模型 ID 的路径。

## 定时任务建议

当前仓库没有伪造不存在的 Cron 配置。部署到 Cloudflare Workers 后，将 `POST /api/admin/models/sync` 绑定到受保护的定时触发器；每次运行记录 `model_registry_sync_runs`，失败只更新服务商状态和错误摘要，不覆盖上一份成功快照。这样价格接口短时中断不会让页面出现空名单。

## 采用边界

- 不纳入只有本地下载权重而没有可用网络 API 的模型。
- 不把 OpenRouter 的上游模型当作 OpenRouter 原始厂家；`kind = aggregator` 单独展示。
- 不把一次同步结果永久视作价格承诺；前端显示来源和最近同步时间。
- 既有 `model_providers`/`api_models` 表结构保留用于迁移兼容，但 005 迁移会清空其中的旧目录行；新页面模型读取走统一注册中心。
