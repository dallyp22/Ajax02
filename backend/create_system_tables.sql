-- Create system dataset and tables for multi-tenant SaaS platform

-- 1. Create system dataset
CREATE SCHEMA IF NOT EXISTS `rentroll-ai.system`
OPTIONS (
  description = "System tables for multi-tenant SaaS platform",
  location = "US"
);

-- 2. Create clients table
CREATE TABLE IF NOT EXISTS `rentroll-ai.system.clients` (
  client_id STRING NOT NULL,
  client_name STRING NOT NULL,
  dataset_name STRING NOT NULL,
  contact_email STRING,
  subscription_tier STRING,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  updated_at TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSON
)
OPTIONS (
  description = "Client registry and configuration"
);

-- 3. Create users table
CREATE TABLE IF NOT EXISTS `rentroll-ai.system.users` (
  user_id STRING NOT NULL,
  client_id STRING NOT NULL,
  auth0_user_id STRING NOT NULL,
  email STRING NOT NULL,
  role STRING NOT NULL,
  first_name STRING,
  last_name STRING,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  last_login TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
)
OPTIONS (
  description = "User management and authentication"
);

-- 4. Create billing units table
CREATE TABLE IF NOT EXISTS `rentroll-ai.system.billing_units` (
  record_id STRING NOT NULL,
  client_id STRING NOT NULL,
  billing_month DATE NOT NULL,
  unit_count INTEGER NOT NULL,
  calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  metadata JSON
)
OPTIONS (
  description = "Unit count tracking for billing"
);

-- 5. Create audit logs table
CREATE TABLE IF NOT EXISTS `rentroll-ai.system.audit_logs` (
  log_id STRING NOT NULL,
  client_id STRING,
  user_id STRING,
  action STRING NOT NULL,
  resource_type STRING NOT NULL,
  resource_id STRING,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  ip_address STRING,
  user_agent STRING,
  details JSON
)
OPTIONS (
  description = "System audit trail"
);

-- Create a demo client for testing
INSERT INTO `rentroll-ai.system.clients` (client_id, client_name, dataset_name, contact_email, subscription_tier, created_at, is_active, metadata)
SELECT 
  'demo_client_001',
  'Demo Client Properties',
  'client_demo_client_001',
  'demo@example.com',
  'standard',
  CURRENT_TIMESTAMP(),
  TRUE,
  JSON '{"demo": true, "setup_by": "system"}'
WHERE NOT EXISTS (
  SELECT 1 FROM `rentroll-ai.system.clients` WHERE client_id = 'demo_client_001'
);
