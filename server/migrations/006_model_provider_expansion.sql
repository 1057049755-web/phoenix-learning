/* 2026-09-02 官方网络模型目录扩展
 * 只增加有公开模型列表 API 的服务商入口；模型名称与价格仍由同步任务读取，不在迁移中写死。
 */

UPDATE model_registry_providers
SET metadata_json='{"sourcePolicy":"official_api","role":"original_vendor","protocol":"google-generate-content","authHeader":"x-goog-api-key","pagination":"nextPageToken","googleModelId":"baseModelId","modelPath":"google-generate-content"}', updated_at=datetime('now')
WHERE slug='google-ai-studio';

INSERT OR IGNORE INTO model_registry_providers
  (id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,pricing_endpoint,availability_endpoint,api_base,auth_env,status,metadata_json,created_at,updated_at)
VALUES
  ('provider-cerebras','cerebras','Cerebras Inference','official_api','https://inference-docs.cerebras.ai/api-reference/models/list-models','https://inference-docs.cerebras.ai/support/pricing','https://inference-docs.cerebras.ai/legal/privacy-policy','https://api.cerebras.ai/v1/models',NULL,NULL,'https://api.cerebras.ai/v1','FH_MODEL_REGISTRY_KEY_CEREBRAS','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-chat"}',datetime('now'),datetime('now')),
  ('provider-sambanova','sambanova','SambaNova Cloud','cloud_api','https://docs.sambanova.ai/docs/en/integrations/make','https://sambanova.ai/pricing','https://sambanova.ai/privacy-policy','https://api.sambanova.ai/v1/models',NULL,NULL,'https://api.sambanova.ai/v1','FH_MODEL_REGISTRY_KEY_SAMBANOVA','inactive','{"sourcePolicy":"official_api","role":"cloud_platform","protocol":"openai-chat"}',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO migration_runs
  (id,operation,status,backup_ref,candidate_count,detail_json,started_at,finished_at)
VALUES
  ('migration-model-provider-expansion-20260902','model_provider_directory_expansion','completed',NULL,2,'{"providers_added":["cerebras","sambanova"],"model_names_import":"official_api_sync","prices_import":"official_api_sync"}',datetime('now'),datetime('now'));
