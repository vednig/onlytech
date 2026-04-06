-- Create incidents table with snake_case column names
CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  context TEXT NOT NULL,
  what_happened TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  impact TEXT NOT NULL,
  fix TEXT NOT NULL,
  lessons TEXT[] DEFAULT ARRAY[]::TEXT[],
  prevention TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  cost_estimate BIGINT DEFAULT 0,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_incidents_slug ON incidents(slug);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- Insert seed data
INSERT INTO incidents (slug, title, context, what_happened, root_cause, impact, fix, lessons, prevention, tags, cost_estimate, upvotes) VALUES
(
  'aws-s3-deletion-incident',
  'AWS S3 Bucket Accidentally Deleted All Data',
  'A production database backup system relied on an S3 bucket that was automatically cleared by a lifecycle policy intended for temporary files.',
  'A junior engineer created a lifecycle policy to automatically delete objects older than 30 days. The policy was accidentally applied to the wrong S3 bucket - the one containing critical backup data instead of temp files. When the 30-day mark passed, all backups were automatically deleted.',
  'Lack of verification before applying lifecycle policies. No resource tags to differentiate production vs. temporary storage. Missing approval process for destructive operations.',
  'Complete loss of 3 months of database backups. Recovery time: 48 hours. Data loss: 2 days worth of user sessions.',
  ARRAY['Restored from a secondary backup stored in a different region. Implemented a separate bucket specifically for backups with disabled lifecycle policies and cross-region replication.'],
  ARRAY['Always verify the target resource before applying destructive policies. Use clear naming conventions and tags. Implement approval workflows for production changes. Test lifecycle policies in staging first.'],
  ARRAY['Separate buckets for different data types. Enable S3 Object Lock for critical backups. Multi-region replication for backup data. Code review for all infrastructure changes.'],
  ARRAY['aws', 'backup', 'data-loss', 'infrastructure'],
  2500000,
  42
),
(
  'dns-ttl-misconfiguration',
  'DNS TTL Set to 1 Year Breaks All Updates',
  'During a migration to a new CDN provider, a DNS record was configured with an extremely long TTL, thinking it would improve performance.',
  'An engineer set the TTL to 31536000 seconds (1 year) to "reduce DNS query overhead." This was not noticed during testing because the old DNS server was still responding correctly. After deployment, DNS caches worldwide retained the old IP address for the entire year TTL period.',
  'Lack of understanding of DNS TTL behavior. No peer review of DNS changes. Testing performed on a network where local DNS cache was cleared.',
  '15 hours of complete outage for 23% of users across regions that happened to query the authoritative nameserver during the issue window.',
  ARRAY['Immediately reduced TTL to 300 seconds, but global DNS caches still held the old records. Mitigated by updating the secondary nameserver with the correct IP while waiting for caches to expire.'],
  ARRAY['TTL should never exceed 1 hour for active services. Always test DNS changes with propagation delay in mind. Use monitoring to detect DNS propagation issues. Have a runbook for DNS emergencies.'],
  ARRAY['Standard TTL of 300-3600 seconds for production. Automated DNS change testing. Alert on DNS propagation delays. Have secondary nameserver with updated records ready.'],
  ARRAY['dns', 'infrastructure', 'outage'],
  850000,
  28
),
(
  'memory-leak-production',
  'Memory Leak in Production Caused Cascading Failures',
  'A new logging service was deployed to production that had a subtle memory leak in its event handler cleanup.',
  'The logging service stored references to event listeners but never properly cleaned them up when streams closed. Over 72 hours, each server instance accumulated gigabytes of memory from orphaned listener objects.',
  'Lack of memory profiling before production deployment. Event listener cleanup logic had a subtle bug where listeners weren''t being removed from the tracking array.',
  'All production servers OOMKilled simultaneously. This caused a cascading failure - the autoscaler tried to spin up new instances, but they also hit OOMKilled limits. Services went down for 2 hours.',
  ARRAY['Rolled back the logging service to the previous version. Added memory profiling to the CI/CD pipeline. Implemented alerts for memory growth patterns.'],
  ARRAY['Always profile memory usage, especially for event-driven code. Load test new services for 24+ hours. Implement memory alerts at 50% and 75% thresholds. Review listener cleanup code carefully.'],
  ARRAY['Mandatory memory profiling in staging environment. Alert on memory growth > 5% per hour. Canary deploy to 5% of servers first. Automated memory regression tests.'],
  ARRAY['nodejs', 'memory-leak', 'production', 'outage'],
  1200000,
  35
),
(
  'billing-system-double-charge',
  'Billing System Bug Charged Customers Twice',
  'A concurrent processing issue in the billing system caused duplicate charges for the same transaction.',
  'When implementing retry logic for failed transactions, the code checked if a transaction was in progress but there was a race condition. Between the check and the actual debit, another process could start the same transaction, resulting in two database writes.',
  'Lack of database transaction isolation guarantees. Race condition between check and write (TOCTOU). No idempotency keys for payment operations.',
  'Approximately 8,000 customers were double-charged, totaling $2.4 million in erroneous charges. Customer trust significantly impacted.',
  ARRAY['Manually refunded all affected customers within 24 hours. Implemented database locks using SELECT FOR UPDATE. Added idempotency key support to prevent duplicate charges.'],
  ARRAY['Always assume concurrency is possible. Use proper database isolation levels. Implement idempotency for all financial operations. Assume your code will be called multiple times with same input.'],
  ARRAY['Serializable isolation level for payment transactions. Idempotency keys required for all payment endpoints. Automated chaos testing for race conditions. Financial transaction code review from payment specialist.'],
  ARRAY['billing', 'concurrency', 'financial', 'bug'],
  2400000,
  51
),
(
  'misconfigured-db-permissions',
  'Production Database Exposed to Internet',
  'A database security group was misconfigured during infrastructure as code migration.',
  'During the migration from manual AWS console configuration to Terraform, the ingress rule for the database was mistakenly changed from restricted IP ranges to 0.0.0.0/0. The change was approved because it looked like a formatting difference, not a security change.',
  'Insufficient code review for infrastructure changes. Security groups not caught by static analysis. IaC change visualization didn''t highlight the security impact clearly.',
  'Database exposed to the internet for 6 hours. Attackers accessed customer PII for 2000+ users. Media coverage and regulatory investigation required.',
  ARRAY['Immediately reverted the change and applied correct security group. Audited all customer data potentially accessed. Implemented AWS GuardDuty alerts.'],
  ARRAY['Every infrastructure change must have dedicated security review. Use tags to distinguish production resources. Implement automated checks for overly permissive security rules. All secrets must be rotated after any exposure.'],
  ARRAY['Require security-focused code review for all IaC changes. Automated checks that fail on 0.0.0.0 ingress rules. Security group tagging enforced. Secrets rotation automation.'],
  ARRAY['security', 'infrastructure', 'database'],
  4000000,
  67
);
