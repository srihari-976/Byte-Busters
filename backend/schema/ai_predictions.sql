-- AI Predictions and Alerts Schema
-- Phase 5: AI-Powered Predictive Alerts

-- Predictions table for ML model outputs
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(16) NOT NULL CHECK (entity_type IN ('MO', 'WO', 'PRODUCT')),
  entity_id UUID NOT NULL,
  model_version VARCHAR(32) NOT NULL,
  score DECIMAL(5,4) NOT NULL CHECK (score >= 0 AND score <= 1),
  risk_level VARCHAR(8) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  top_reasons JSONB DEFAULT '[]'::jsonb,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Alerts generated from predictions
CREATE TABLE IF NOT EXISTS alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id),
  alert_type VARCHAR(32) NOT NULL CHECK (alert_type IN ('MO_DELAY', 'WO_DELAY', 'STOCK_SHORTAGE')),
  entity_type VARCHAR(16) NOT NULL,
  entity_id INTEGER NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  severity VARCHAR(8) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  message TEXT NOT NULL,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(16) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
  created_by INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  acknowledged_by INTEGER,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_by INTEGER,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Prediction logs for monitoring and retraining
CREATE TABLE IF NOT EXISTS prediction_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id),
  inputs JSONB NOT NULL,
  raw_output JSONB NOT NULL,
  outcome JSONB,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Feature store for ML features
CREATE TABLE IF NOT EXISTS features_mo (
  mo_id INTEGER PRIMARY KEY,
  mo_qty INTEGER,
  bom_component_count INTEGER,
  percent_components_available DECIMAL(5,4),
  min_component_available_ratio DECIMAL(5,4),
  work_center_avg_utilization_7d DECIMAL(5,4),
  avg_wo_duration_product_30d DECIMAL(8,2),
  mo_lead_time_days INTEGER,
  assignee_recent_delay_rate_30d DECIMAL(5,4),
  is_high_priority BOOLEAN,
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS features_stock (
  product_id INTEGER PRIMARY KEY,
  available_qty DECIMAL(10,3),
  reserved_qty DECIMAL(10,3),
  avg_daily_consumption_7d DECIMAL(10,3),
  incoming_po_qty DECIMAL(10,3),
  lead_time_days INTEGER,
  reorder_level DECIMAL(10,3),
  days_of_stock DECIMAL(8,2),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_created ON prediction_logs(created_at DESC);