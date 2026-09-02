# 组卷、批改与学生端工作流接入（第 8 部分）

日期：2026-09-02

## 已接入入口

- 组卷自由出题：`AI.generateQuestions` → `question.batch` → `question.v1` 校验 → 兼容旧题卡显示。
- 组卷整卷分段：`AI.generateSection` → `question.batch` → 每段结构化质量门槛 → 题卡和导出。
- 批改复核：`AI.gradeAnswer` → `grading.score`，评分、评语和得失分点经过结构化适配。
- 学生答案详解：`AI.generateExplanations` → `answer.generate`，结果只以逐题详解组件展示。
- 学生学习计划：`AI.generatePlan` → `practice.personalize`；配套练习 → `practice.exercises`；每日安排 → `practice.schedule`。
- 学情解释：报告页先计算有效作业和各科数量，未达到每科三次时不调用模型；达到门槛后才进入 `analytics.explain`。

## 页面边界

`assets/js/workflow-bridge.js` 是兼容层。组卷、批改、报告和学生学习页已经切换到新的工作台视图；AI 请求统一由 `FH_AI_WORKFLOWS` 发起，模型返回先转换成结构化领域对象，再交给专用组件渲染。用户看不到 JSON、系统提示词、原始模型输出和隐藏推理。

工作流执行器对结构化输出为空、Schema 不合格和质量门槛失败执行最多一次重试；每次请求由服务端写入 `workflow_runs`，记录工作流、模型、用量、耗时和结果状态。

`assets/js/reference-data.js` 只加载服务端启用的教材目录、年度卷型和模型目录。没有服务端记录时保持空目录，不用本地题库、旧版教材或旧地区卷型填充。

## 验收重点

- 组卷未配置网络 AI 时不会回填本地题目。
- 题目缺少答案、解析、知识点、来源或生成记录时，不进入题卡结果。
- 批改失败只显示失败原因，不写入伪造评分。
- 学情报告先执行确定性门槛；每个选中学科分别少于三次时，显示当前数量和缺口，不消耗模型额度。
- 学生端计划、配套题和每日安排均通过新工作流；保存仍由现有数据层处理。
