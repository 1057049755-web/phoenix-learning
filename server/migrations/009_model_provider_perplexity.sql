/* 2026-09-02 Perplexity 官方网络 API 目录 */

INSERT OR IGNORE INTO model_registry_providers
  (id,slug,name,kind,docs_url,pricing_url,data_policy_url,models_endpoint,pricing_endpoint,availability_endpoint,api_base,auth_env,status,metadata_json,created_at,updated_at)
VALUES
  ('provider-perplexity','perplexity','Perplexity API','official_api','https://docs.perplexity.ai/api-reference/models-get','https://docs.perplexity.ai/docs/agent-api/models','https://docs.perplexity.ai/guides/data-privacy','https://api.perplexity.ai/v1/models','https://docs.perplexity.ai/docs/agent-api/models',NULL,'https://api.perplexity.ai/v1','FH_MODEL_REGISTRY_KEY_PERPLEXITY','inactive','{"sourcePolicy":"official_api","role":"original_vendor","protocol":"openai-responses","endpointPath":"/agent"}',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO migration_runs
  (id,operation,status,backup_ref,candidate_count,detail_json,started_at,finished_at)
VALUES
  ('migration-model-provider-perplexity-20260902','model_provider_directory_perplexity','completed',NULL,1,'{"providers_added":["perplexity"],"model_names_import":"official_api_sync","prices_import":"official_source_or_api"}',datetime('now'),datetime('now'));
