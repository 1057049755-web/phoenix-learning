/* 2026-09-02 模型目录重置
 * 目标：清空旧模型/接口目录数据，再建立可由官方网络 API 同步的服务商目录。
 * 备份表在同一数据库内保留，API Key、用户、作业、试卷和真实业务记录不在操作范围内。
 */

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_registry_providers_20260902 AS
  SELECT * FROM model_registry_providers WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_registry_providers_20260902
  SELECT * FROM model_registry_providers;

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_registry_models_20260902 AS
  SELECT * FROM model_registry_models WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_registry_models_20260902
  SELECT * FROM model_registry_models;

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_registry_sync_runs_20260902 AS
  SELECT * FROM model_registry_sync_runs WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_registry_sync_runs_20260902
  SELECT * FROM model_registry_sync_runs;

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_registry_history_20260902 AS
  SELECT * FROM model_registry_history WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_registry_history_20260902
  SELECT * FROM model_registry_history;

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_legacy_providers_20260902 AS
  SELECT * FROM model_providers WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_legacy_providers_20260902
  SELECT * FROM model_providers;

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_legacy_models_20260902 AS
  SELECT * FROM api_models WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_legacy_models_20260902
  SELECT * FROM api_models;

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_legacy_sync_runs_20260902 AS
  SELECT * FROM model_sync_runs WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_legacy_sync_runs_20260902
  SELECT * FROM model_sync_runs;

CREATE TABLE IF NOT EXISTS model_catalog_reset_backup_records_20260902 AS
  SELECT * FROM records WHERE 0;
INSERT OR IGNORE INTO model_catalog_reset_backup_records_20260902
  SELECT * FROM records
  WHERE collection_name IN ('model_providers','api_models','model_sync_runs','model_registry_providers','model_registry_models');

DELETE FROM model_registry_history;
DELETE FROM model_registry_models;
DELETE FROM model_registry_sync_runs;
DELETE FROM model_registry_providers;
DELETE FROM api_models;
DELETE FROM model_providers;
DELETE FROM model_sync_runs;
DELETE FROM records
  WHERE collection_name IN ('model_providers','api_models','model_sync_runs','model_registry_providers','model_registry_models');

INSERT OR IGNORE INTO model_registry_providers
  (id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,pricing_endpoint,availability_endpoint,api_base,auth_env,status,metadata_json,created_at,updated_at)
VALUES
  ('provider-openrouter','openrouter','OpenRouter','aggregator','https://openrouter.ai/docs/api/api-reference/models/get-models','https://openrouter.ai/models','https://openrouter.ai/docs/faq','https://openrouter.ai/api/v1/models','https://openrouter.ai/api/v1/models','https://openrouter.ai/api/v1/models','https://openrouter.ai/api/v1','FH_MODEL_REGISTRY_KEY_OPENROUTER','inactive','{"sourcePolicy":"official_api","role":"aggregation_platform","protocol":"openai-chat","modelListModalities":["text","image","audio","video","embedding"]}',datetime('now'),datetime('now')),
  ('provider-openai','openai','OpenAI','official_api','https://platform.openai.com/docs/api-reference/models','https://openai.com/api/pricing/','https://openai.com/enterprise-privacy/','https://api.openai.com/v1/models',NULL,NULL,'https://api.openai.com/v1','FH_MODEL_REGISTRY_KEY_OPENAI','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-responses"}',datetime('now'),datetime('now')),
  ('provider-anthropic','anthropic','Anthropic','official_api','https://docs.anthropic.com/en/api/models-list','https://www.anthropic.com/pricing','https://www.anthropic.com/legal/commercial-terms','https://api.anthropic.com/v1/models',NULL,NULL,'https://api.anthropic.com/v1','FH_MODEL_REGISTRY_KEY_ANTHROPIC','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"anthropic-messages","authHeader":"x-api-key","extraHeaders":{"anthropic-version":"2023-06-01"},"pagination":"afterId"}',datetime('now'),datetime('now')),
  ('provider-google-ai-studio','google-ai-studio','Google AI Studio','official_api','https://ai.google.dev/api/models','https://ai.google.dev/gemini-api/docs/pricing','https://ai.google.dev/gemini-api/terms','https://generativelanguage.googleapis.com/v1beta/models',NULL,NULL,'https://generativelanguage.googleapis.com/v1beta','FH_MODEL_REGISTRY_KEY_GOOGLE_AI_STUDIO','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-chat","authHeader":"x-goog-api-key","pagination":"nextPageToken","googleModelId":"baseModelId"}',datetime('now'),datetime('now')),
  ('provider-deepseek','deepseek','DeepSeek','official_api','https://api-docs.deepseek.com/api/list-models','https://api-docs.deepseek.com/quick_start/pricing','https://cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html','https://api.deepseek.com/models','https://api-docs.deepseek.com/quick_start/pricing',NULL,'https://api.deepseek.com','FH_MODEL_REGISTRY_KEY_DEEPSEEK','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-chat"}',datetime('now'),datetime('now')),
  ('provider-alibaba-model-studio','alibaba-model-studio','阿里云百炼 Model Studio','cloud_api','https://help.aliyun.com/zh/model-studio/list-models','https://help.aliyun.com/zh/model-studio/models','https://terms.alicdn.com/legal-agreement/terms/suit_bu1_aliyun/suit_bu1_aliyun202112271434_86114.html','https://dashscope.aliyuncs.com/api/v1/models','https://help.aliyun.com/zh/model-studio/models',NULL,'https://dashscope.aliyuncs.com/compatible-mode/v1','FH_MODEL_REGISTRY_KEY_ALIBABA_MODEL_STUDIO','inactive','{"sourcePolicy":"official_api","role":"cloud_platform","protocol":"openai-chat","pagination":"pageNo","pageSize":100,"region":"cn-beijing"}',datetime('now'),datetime('now')),
  ('provider-baidu-qianfan','baidu-qianfan','百度智能云千帆','cloud_api','https://cloud.baidu.com/doc/qianfan-api/s/Dmba8k71y','https://cloud.baidu.com/doc/qianfan/s/Smoghsq3g','https://cloud.baidu.com/doc/qianfan-docs/s/0m8r1domp','https://qianfan.baidubce.com/v2/models',NULL,NULL,'https://qianfan.baidubce.com/v2','FH_MODEL_REGISTRY_KEY_BAIDU_QIANFAN','inactive','{"sourcePolicy":"official_api","role":"cloud_platform","protocol":"openai-chat"}',datetime('now'),datetime('now')),
  ('provider-siliconflow','siliconflow','硅基流动','cloud_api','https://docs.siliconflow.cn/en/api-reference/models/get-model-list','https://siliconflow.cn/pricing','https://siliconflow.cn/terms','https://api.siliconflow.cn/v1/models',NULL,NULL,'https://api.siliconflow.cn/v1','FH_MODEL_REGISTRY_KEY_SILICONFLOW','inactive','{"sourcePolicy":"official_api","role":"cloud_platform","protocol":"openai-chat","modelTypes":["text","image","audio","video","embedding","rerank"]}',datetime('now'),datetime('now')),
  ('provider-mistral','mistral','Mistral AI','official_api','https://docs.mistral.ai/api/endpoint/models','https://mistral.ai/technology/#pricing','https://mistral.ai/terms/','https://api.mistral.ai/v1/models',NULL,NULL,'https://api.mistral.ai/v1','FH_MODEL_REGISTRY_KEY_MISTRAL','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-chat"}',datetime('now'),datetime('now')),
  ('provider-groq','groq','GroqCloud','cloud_api','https://console.groq.com/docs/models','https://groq.com/pricing','https://groq.com/privacy-policy/','https://api.groq.com/openai/v1/models',NULL,NULL,'https://api.groq.com/openai/v1','FH_MODEL_REGISTRY_KEY_GROQ','inactive','{"sourcePolicy":"official_api","role":"cloud_platform","protocol":"openai-chat"}',datetime('now'),datetime('now')),
  ('provider-together','together','Together AI','cloud_api','https://docs.together.ai/reference/models','https://www.together.ai/pricing','https://www.together.ai/terms-of-service','https://api.together.xyz/v1/models',NULL,NULL,'https://api.together.xyz/v1','FH_MODEL_REGISTRY_KEY_TOGETHER','inactive','{"sourcePolicy":"official_api","role":"cloud_platform","protocol":"openai-chat"}',datetime('now'),datetime('now')),
  ('provider-fireworks','fireworks','Fireworks AI','cloud_api','https://docs.fireworks.ai/models/overview','https://fireworks.ai/pricing','https://fireworks.ai/terms-of-service','https://api.fireworks.ai/inference/v1/models',NULL,NULL,'https://api.fireworks.ai/inference/v1','FH_MODEL_REGISTRY_KEY_FIREWORKS','inactive','{"sourcePolicy":"official_api","role":"cloud_platform","protocol":"openai-chat"}',datetime('now'),datetime('now')),
  ('provider-cohere','cohere','Cohere','official_api','https://docs.cohere.com/reference/list-models','https://cohere.com/pricing','https://cohere.com/terms-of-use','https://api.cohere.com/v1/models','https://cohere.com/pricing',NULL,'https://api.cohere.com/v1','FH_MODEL_REGISTRY_KEY_COHERE','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"cohere-chat","pagination":"next_page_token"}','2026-09-02T00:00:00.000Z','2026-09-02T00:00:00.000Z'),
  ('provider-xai','xai','xAI','official_api','https://docs.x.ai/developers/rest-api-reference/inference/models','https://docs.x.ai/developers/pricing','https://x.ai/legal/terms-of-service','https://api.x.ai/v1/models',NULL,NULL,'https://api.x.ai/v1','FH_MODEL_REGISTRY_KEY_XAI','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-chat","xaiPricingUnit":"micro_usd_per_token"}',datetime('now'),datetime('now')),
  ('provider-replicate','replicate','Replicate','aggregator','https://replicate.com/docs/reference/http','https://replicate.com/pricing','https://replicate.com/terms','https://api.replicate.com/v1/models',NULL,NULL,'https://api.replicate.com/v1','FH_MODEL_REGISTRY_KEY_REPLICATE','inactive','{"sourcePolicy":"official_api","role":"aggregation_platform","protocol":"replicate-predictions","pagination":"next"}',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO migration_runs
  (id,operation,status,backup_ref,candidate_count,detail_json,started_at,finished_at)
VALUES
  ('migration-model-catalog-reset-20260902','model_catalog_reset','completed','model_catalog_reset_backup_*_20260902',0,'{"scope":"model_catalog_only","providers_seeded":15,"models_seeded":0,"model_import":"official_api_sync","credentials_preserved":true}',datetime('now'),datetime('now'));
