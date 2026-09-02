# 外部来源与 GitHub 候选项目核验（第 4 部分）

核验日期：2026-09-02  
说明：本报告只记录来源、能力和采用边界，不把网页正文、整本教材或题目内容复制到仓库。

## 1. 官方课程与教材来源

| 来源 | 可核验内容 | 本系统用途 | 当前处理 |
|---|---|---|---|
| [教育部义务教育课程方案和课程标准（2022 年版）通知](https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html) | 课程方案、九学科相关课程标准的官方入口和执行时间 | 建立课程标准层、能力维度和学段边界 | 只保存来源、版本和结构化摘要，不复制正文 |
| [教育部义务教育课程方案及各学科课程标准索引](https://www.moe.gov.cn/jyb_xxgk/xxgk/neirong/fenlei/kcjc/kcjc_js/jcjs_kcbz/?eqid=962b1323002f304f00000006648efc93) | 官方标准目录和后续更新入口 | 作为标准版本核验入口 | 纳入来源注册表 |
| [2024 年义务教育国家课程教学用书目录](https://www.moe.gov.cn/srcsite/A26/s8001/202408/W020240805496325238752.pdf) | 正式教学用书目录、学科、出版社及版本信息 | 建立候选教材版本清单 | 只抽取书目信息、年级、册次和来源链接 |
| [国家中小学智慧教育平台](https://basic.smartedu.cn/) | 课程教学、教材、教师研修等官方平台入口 | 核验教材/课程资源是否公开可访问，作为合法来源线索 | 不抓取整本教材正文；按版权和平台规则处理 |
| [甘肃省 2025 年基础教育精品课名单](https://jyt.gansu.gov.cn/jyt/c110634/202512/174263827/files/78a2ce2f0db94898bfffab2103998841.pdf) | 甘肃学校公开使用的学段、学科、版本、年级/册次、课名记录 | 作为甘肃教材采用的辅助证据 | 只能证明公开采用案例，不能单独替代正式教材目录 |
| [宁夏初中学业水平考试调整政策解读](https://jyt.nx.gov.cn/zwgk/zcwj/zcjd/202310/t20231018_4315230.html) | 2024/2025 与 2026 起的考试科目、分值和考试安排变化 | 建立按年份版本化的宁夏模板 | 不与其他地区合并，不设为通用默认 |

目前只完成了来源入口和样例政策的核验，没有导入任何教材章节、知识点或地区试卷数据。正式入库仍需逐地区、逐学科、逐年份核验来源链接、发布时间、总分、题型、题量、分值和考试规则。

## 2. GitHub 候选项目对比

Stars 和维护信息按 GitHub 官方仓库页面在核验日可见信息记录，属于动态指标；采用时仍要固定提交号/版本并重新检查依赖许可证。没有复制任何候选仓库代码。

| 项目 | GitHub 地址 | 许可证 | 主要能力 | 安全/引入风险 | 结论 |
|---|---|---|---|---|---|
| Qdrant | [qdrant/qdrant](https://github.com/qdrant/qdrant) | Apache-2.0 | 向量检索、稠密/稀疏/多向量、payload 过滤、混合检索；提供 REST/gRPC | 需要独立服务或云服务；需做租户隔离、索引权限和数据保留策略 | 候选主检索引擎；只保存可重建索引，结构化数据库仍是事实源 |
| LlamaIndex | [run-llama/llama_index](https://github.com/run-llama/llama_index) | MIT | 文档连接器、索引、图结构、检索、工作流和多种集成 | 依赖面大，集成插件和托管解析服务需逐项审查；容易把用户资料直接暴露给模型 | 作为架构参考或隔离服务候选，不直接复制代码 |
| Haystack | [deepset-ai/haystack](https://github.com/deepset-ai/haystack) | Apache-2.0；仓库页面提示存在需继续核验的其他许可头 | 可组合 RAG、路由、检索、生成和 Agent 管道 | 组件多、依赖图和第三方连接器安全面较大 | 候选工作流编排参考；引入前做完整依赖和安全扫描 |
| Unstructured | [Unstructured-IO/unstructured](https://github.com/Unstructured-IO/unstructured)；[API 仓库](https://github.com/Unstructured-IO/unstructured-api) | Apache-2.0（以目标版本和依赖清单为准） | PDF、Office、HTML、图片、表格等文档分区和解析；支持托管 API | OCR/文档解析耗资源，托管 API 需密钥和数据政策；不能绕过权限、付费墙或验证码 | 资料采集第二阶段的解析服务候选，优先隔离部署或官方 API |
| Trafilatura | [adbar/trafilatura](https://github.com/adbar/trafilatura) | v1.8.0 以后 Apache-2.0；更早版本 GPLv3+ | 正文、元数据、段落、表格、图片、RSS、站点地图、去噪和去重 | 旧版本许可证不同；采集仍须尊重 robots、访问权限和版权边界 | 候选第一阶段正文抽取器；固定到 Apache-2.0 版本并保留许可证 |
| FlagEmbedding | [FlagOpen/FlagEmbedding](https://github.com/FlagOpen/FlagEmbedding) | 代码 MIT；模型、数据和服务条款需分别核验 | 中文/多语言 Embedding、BGE Reranker、检索评估和训练工具 | 用户要求不纳入只能本地下载的模型；模型权重许可、服务商和数据保留政策不能从代码许可证推断 | 仅通过可用网络 API 服务纳入模型注册中心；不下载权重作为产品依赖 |
| Sentence Transformers | [UKPLab/sentence-transformers](https://github.com/UKPLab/sentence-transformers) | Apache-2.0 | Embedding、Cross-Encoder、稀疏向量和检索训练；约 18.8k stars、2.8k forks | Python/PyTorch 依赖较重；模型本身的许可证和网络 API 可用性需独立核验 | 作为 Embedding/Rerank API 适配参考，不在前端本地部署 |
| SymPy | [sympy/sympy](https://github.com/sympy/sympy) | BSD | 符号计算、方程/不等式、代数和数学表达式验证 | 必须限制表达式复杂度、超时和允许函数，不能执行任意代码 | 数学题独立解题和符号校验候选 |
| Matplotlib | [matplotlib/matplotlib](https://github.com/matplotlib/matplotlib)；[许可证说明](https://github.com/matplotlib/matplotlib/blob/main/doc/project/license.rst) | BSD 兼容/PSF 基础，第三方资源需单列核验 | 统计图、函数图、SVG/PNG 输出和打印控制 | 服务端渲染资源消耗和字体/第三方 colormap 许可需审查 | 统计、函数、科学图表的受限渲染候选 |
| Manim Community | [ManimCommunity/manim](https://github.com/ManimCommunity/manim) | MIT 双许可证文件 | 数学动画、SVG 对象、几何和动态演示 | 依赖链较重；动画不是静态试卷的默认产物；特定素材有额外版权边界 | 仅用于需要动态演示的独立制图 Skill，不作为普通题目默认引擎 |

### 动态活跃度记录

以下是核验日 GitHub 页面显示的可比指标，属于会变化的参考值，不写入运行时配置：Qdrant 约 33.3k stars；LlamaIndex 约 50.9k stars、7.8k forks；Haystack 约 25.4k stars，页面显示 226 个 release，v2.29.0 发布于 2026-05-12；Unstructured 约 15.3k stars、1.3k forks；Trafilatura 约 6.7k stars、417 forks；Sentence Transformers 约 18.8k stars、2.8k forks；SymPy 约 14.7k stars、5.3k forks；Matplotlib 约 22.8k stars、8.3k forks；Manim Community 约 38.7k stars、2.9k forks。FlagEmbedding 页面显示 1,462 次提交、29 个开放 PR，且近期有安全相关修复记录。

这些指标与许可证、维护频率、依赖安全和中文教育适配性一起判断，不能单独代表适合生产使用。

## 3. 采用原则

- 先以 D1 结构化表保存课程、知识点、题目、来源和审核事实，再用向量索引做召回；索引必须带内容版本、来源版本和模型版本，可以全量重建。
- 第三方代码只在许可证、依赖和版本固定后引入；保留仓库地址、版本/提交号、许可证文本或 NOTICE。
- 模型权重、数据集、托管 API 与代码许可证分开核验，不能因为 GitHub 仓库是 MIT/Apache 就默认所有模型和数据可商用。
- 文档解析器放在受限任务中，设置超时、内存和文件大小限制；不执行模型生成的系统命令或任意脚本。
- 资料采集严格执行公开访问、允许采集、官方来源优先的三层流程；失败时记录原因，不绕过登录、付费墙、验证码或 robots 限制。

## 4. 当前启用目录范围之外的内容

- 九学科其余教材版本和章节目录：保留在来源工作清单中，只有完成逐版本目录采集和地区采用核验后才会进入启用目录。
- 甘肃、青海、宁夏、新疆、西藏其余年份的初中学业水平考试结构：只有形成完整逐年结构表后才会进入可选模板。
- 任何题目、教材正文、教辅、完整试卷和向量嵌入：没有写入仓库；模型价格与可用状态由模型目录同步任务提供。
