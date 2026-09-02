/* 网络模型注册中心
 * 服务商与聚合平台分开；模型明细由官方接口同步，不在前端硬编码名称、价格或状态。
 */

CREATE TABLE IF NOT EXISTS model_registry_providers (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('official_api','cloud_api','aggregator')),
  docs_url TEXT NOT NULL,
  pricing_url TEXT,
  data_policy_url TEXT,
  models_endpoint TEXT NOT NULL,
  pricing_endpoint TEXT,
  availability_endpoint TEXT,
  api_base TEXT,
  auth_env TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_synced_at TEXT,
  last_error TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_registry_models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  canonical_key TEXT NOT NULL,
  provider_model_id TEXT NOT NULL,
  upstream_provider TEXT,
  official_name TEXT NOT NULL,
  exact_version TEXT,
  model_type TEXT NOT NULL,
  capabilities_json TEXT NOT NULL DEFAULT '{}',
  limits_json TEXT NOT NULL DEFAULT '{}',
  pricing_json TEXT NOT NULL DEFAULT '{}',
  availability_json TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available',
  source_url TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  last_verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(provider_id, provider_model_id)
);

CREATE TABLE IF NOT EXISTS model_registry_sync_runs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL,
  source_url TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  finished_at TEXT,
  model_count INTEGER NOT NULL DEFAULT 0,
  changed_count INTEGER NOT NULL DEFAULT 0,
  source_hash TEXT,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS model_registry_history (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  captured_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_registry_models_provider_status ON model_registry_models(provider_id, status, model_type);
CREATE INDEX IF NOT EXISTS idx_model_registry_sync_runs_provider_time ON model_registry_sync_runs(provider_id, requested_at);

INSERT OR IGNORE INTO model_registry_providers
  (id, slug, name, kind, docs_url, pricing_url, data_policy_url, models_endpoint, pricing_endpoint, availability_endpoint, api_base, auth_env, status, metadata_json, created_at, updated_at)
VALUES
  ('provider-openrouter', 'openrouter', 'OpenRouter', 'aggregator', 'https://openrouter.ai/docs/api/api-reference/models/get-models', 'https://openrouter.ai/models', 'https://openrouter.ai/docs/faq', 'https://openrouter.ai/api/v1/models', 'https://openrouter.ai/api/v1/models', 'https://openrouter.ai/api/v1/models', 'https://openrouter.ai/api/v1', 'FH_MODEL_REGISTRY_KEY_OPENROUTER', 'inactive', '{"source_policy":"official_api","model_list_supports":"text,image,audio,video,embedding","role":"aggregation_platform"}', datetime('now'), datetime('now')),
  ('provider-openai', 'openai', 'OpenAI', 'official_api', 'https://platform.openai.com/docs/models', 'https://openai.com/api/pricing/', 'https://openai.com/enterprise-privacy/', 'https://api.openai.com/v1/models', NULL, NULL, 'https://api.openai.com/v1', 'FH_MODEL_REGISTRY_KEY_OPENAI', 'inactive', '{"source_policy":"official_api","role":"original_vendor"}', datetime('now'), datetime('now')),
  ('provider-google-ai-studio', 'google-ai-studio', 'Google AI Studio', 'official_api', 'https://ai.google.dev/gemini-api/docs/models', 'https://ai.google.dev/gemini-api/docs/pricing', 'https://ai.google.dev/gemini-api/terms', 'https://generativelanguage.googleapis.com/v1beta/models', NULL, NULL, 'https://generativelanguage.googleapis.com/v1beta', 'FH_MODEL_REGISTRY_KEY_GOOGLE_AI_STUDIO', 'inactive', '{"source_policy":"official_api","role":"original_vendor","authHeader":"x-goog-api-key"}', datetime('now'), datetime('now'));
