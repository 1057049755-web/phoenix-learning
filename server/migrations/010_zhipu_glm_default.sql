/* 2026-09-02 智谱官方网络 API 与 GLM-4-Flash 默认入口
 * 模型清单通过官方 /models 接口同步；这里仅登记服务商入口和官方定价页中的默认模型价格。
 */

INSERT OR IGNORE INTO model_registry_providers
  (id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,pricing_endpoint,availability_endpoint,api_base,auth_env,status,metadata_json,created_at,updated_at)
VALUES
  ('provider-zhipu','zhipu','智谱AI（BigModel）','official_api',
   'https://docs.bigmodel.cn/cn/guide/models/free/glm-4-flash-250414',
   'https://bigmodel.cn/pricing',NULL,
   'https://open.bigmodel.cn/api/paas/v4/models',NULL,NULL,
   'https://open.bigmodel.cn/api/paas/v4','FH_MODEL_REGISTRY_KEY_ZHIPU','inactive',
   '{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-chat","defaultModel":"glm-4-flash-250414","defaultName":"智谱 GLM-4-Flash（默认）","defaultModelName":"GLM-4-Flash-250414（免费）","defaultPricing":{"unit":"CNY_per_token","currency":"CNY","prompt":0,"completion":0,"source":"official_pricing_page"}}',
   datetime('now'),datetime('now'));

INSERT OR IGNORE INTO migration_runs
  (id,operation,status,backup_ref,candidate_count,detail_json,started_at,finished_at)
VALUES
  ('migration-zhipu-glm-default-20260902','zhipu_provider_and_default_model','completed',NULL,1,
   '{"provider":"zhipu","defaultModel":"glm-4-flash-250414","pricingSource":"https://bigmodel.cn/pricing","credentialsPreserved":true}',
   datetime('now'),datetime('now'));
