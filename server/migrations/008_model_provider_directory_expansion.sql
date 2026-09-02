/* 2026-09-02 官方可调用模型平台补充
 * 仅登记能通过官方网络 API 获取目录的入口；具体模型、价格和状态仍由同步任务写入。
 */

INSERT OR IGNORE INTO model_registry_providers
  (id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,pricing_endpoint,availability_endpoint,api_base,auth_env,status,metadata_json,created_at,updated_at)
VALUES
  ('provider-minimax','minimax','MiniMax 开放平台','official_api','https://platform.minimaxi.com/docs/api-reference/models/openai/list-models','https://platform.minimaxi.com/docs/guides/pricing-paygo','https://www.minimaxi.com/terms','https://api.minimaxi.com/v1/models','https://platform.minimaxi.com/docs/guides/pricing-paygo',NULL,'https://api.minimaxi.com/v1','FH_MODEL_REGISTRY_KEY_MINIMAX','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-chat","endpointPath":"/text/chatcompletion_v2"}',datetime('now'),datetime('now')),
  ('provider-tencent-tokenhub','tencent-tokenhub','腾讯云 TokenHub','aggregator','https://cloud.tencent.com/document/product/1823/130079','https://cloud.tencent.com/document/product/1823/130051','https://cloud.tencent.com/document/product/1823','https://tokenhub.tencentmaas.com/v1/models','https://cloud.tencent.com/document/product/1823/130051',NULL,'https://tokenhub.tencentmaas.com/v1','FH_MODEL_REGISTRY_KEY_TENCENT_TOKENHUB','inactive','{"sourcePolicy":"official_api","role":"aggregation_platform","protocol":"openai-chat","modelListStatusField":"status"}',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO migration_runs
  (id,operation,status,backup_ref,candidate_count,detail_json,started_at,finished_at)
VALUES
  ('migration-model-provider-directory-expansion-20260902','model_provider_directory_expansion_2','completed',NULL,2,'{"providers_added":["minimax","tencent-tokenhub"],"model_names_import":"official_api_sync","prices_import":"official_source_or_api"}',datetime('now'),datetime('now'));
