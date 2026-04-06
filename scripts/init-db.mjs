import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function initializeDatabase() {
  try {
    console.log('Creating incidents table...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(500) NOT NULL,
        context TEXT NOT NULL,
        what_happened TEXT NOT NULL,
        root_cause TEXT NOT NULL,
        impact TEXT NOT NULL,
        fix TEXT NOT NULL,
        lessons TEXT NOT NULL,
        prevention TEXT NOT NULL,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        cost_estimate BIGINT DEFAULT 0,
        upvotes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Creating indexes...');
    
    await sql`CREATE INDEX IF NOT EXISTS idx_incidents_slug ON incidents(slug)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC)`;

    console.log('Seeding sample data...');
    
    const incidents = [
      {
        slug: 'aws-s3-deletion-incident',
        title: 'AWS S3 Bucket Accidentally Deleted All Data',
        context: 'A production database backup system relied on an S3 bucket that was automatically cleared by a lifecycle policy intended for temporary files.',
        what_happened: 'A junior engineer created a lifecycle policy to automatically delete objects older than 30 days. The policy was accidentally applied to the wrong S3 bucket.',
        root_cause: 'Lack of verification before applying lifecycle policies. No resource tags to differentiate production vs. temporary storage.',
        impact: 'Complete loss of 3 months of database backups. Recovery time: 48 hours.',
        fix: 'Restored from a secondary backup stored in a different region.',
        lessons: 'Always verify the target resource before applying destructive policies.',
        prevention: 'Separate buckets for different data types. Enable S3 Object Lock for critical backups.',
        tags: ['aws', 'backup', 'data-loss', 'infrastructure'],
        cost_estimate: 2500000,
        upvotes: 42
      },
      {
        slug: 'dns-ttl-misconfiguration',
        title: 'DNS TTL Set to 1 Year Breaks All Updates',
        context: 'During a migration to a new CDN provider, a DNS record was configured with an extremely long TTL.',
        what_happened: 'An engineer set the TTL to 31536000 seconds (1 year) to reduce DNS query overhead.',
        root_cause: 'Lack of understanding of DNS TTL behavior. No peer review of DNS changes.',
        impact: '15 hours of complete outage for 23% of users across regions.',
        fix: 'Immediately reduced TTL to 300 seconds. Mitigated by updating the secondary nameserver.',
        lessons: 'TTL should never exceed 1 hour for active services.',
        prevention: 'Standard TTL of 300-3600 seconds for production. Automated DNS change testing.',
        tags: ['dns', 'infrastructure', 'outage'],
        cost_estimate: 850000,
        upvotes: 28
      },
      {
        slug: 'memory-leak-production',
        title: 'Memory Leak in Production Caused Cascading Failures',
        context: 'A new logging service was deployed to production that had a subtle memory leak.',
        what_happened: 'The logging service stored references to event listeners but never properly cleaned them up.',
        root_cause: 'Lack of memory profiling before production deployment. Event listener cleanup logic had a subtle bug.',
        impact: 'All production servers OOMKilled simultaneously. Services went down for 2 hours.',
        fix: 'Rolled back the logging service to the previous version. Added memory profiling to CI/CD.',
        lessons: 'Always profile memory usage, especially for event-driven code.',
        prevention: 'Mandatory memory profiling in staging environment. Alert on memory growth > 5% per hour.',
        tags: ['nodejs', 'memory-leak', 'production', 'outage'],
        cost_estimate: 1200000,
        upvotes: 35
      },
      {
        slug: 'billing-system-double-charge',
        title: 'Billing System Bug Charged Customers Twice',
        context: 'A concurrent processing issue in the billing system caused duplicate charges.',
        what_happened: 'A race condition existed between checking if a transaction was in progress and executing it.',
        root_cause: 'Lack of database transaction isolation guarantees. Race condition between check and write.',
        impact: 'Approximately 8,000 customers were double-charged, totaling $2.4 million in erroneous charges.',
        fix: 'Manually refunded all affected customers within 24 hours. Implemented database locks.',
        lessons: 'Always assume concurrency is possible. Use proper database isolation levels.',
        prevention: 'Serializable isolation level for payment transactions. Idempotency keys required.',
        tags: ['billing', 'concurrency', 'financial', 'bug'],
        cost_estimate: 2400000,
        upvotes: 51
      },
      {
        slug: 'misconfigured-db-permissions',
        title: 'Production Database Exposed to Internet',
        context: 'A database security group was misconfigured during infrastructure as code migration.',
        what_happened: 'The ingress rule for the database was mistakenly changed from restricted IP ranges to 0.0.0.0/0.',
        root_cause: 'Insufficient code review for infrastructure changes. Security groups not caught by static analysis.',
        impact: 'Database exposed to the internet for 6 hours. Attackers accessed customer PII for 2000+ users.',
        fix: 'Immediately reverted the change and applied correct security group. Audited all customer data.',
        lessons: 'Every infrastructure change must have dedicated security review.',
        prevention: 'Require security-focused code review for all IaC changes. Automated checks for overly permissive rules.',
        tags: ['security', 'infrastructure', 'database'],
        cost_estimate: 4000000,
        upvotes: 67
      }
    ];

    for (const incident of incidents) {
      try {
        await sql`
          INSERT INTO incidents (slug, title, context, what_happened, root_cause, impact, fix, lessons, prevention, tags, cost_estimate, upvotes)
          VALUES (${incident.slug}, ${incident.title}, ${incident.context}, ${incident.what_happened}, ${incident.root_cause}, ${incident.impact}, ${incident.fix}, ${incident.lessons}, ${incident.prevention}, ${incident.tags}, ${incident.cost_estimate}, ${incident.upvotes})
          ON CONFLICT (slug) DO NOTHING
        `;
        console.log(`  ✓ Seeded: ${incident.title}`);
      } catch (error) {
        console.log(`  ⊘ ${incident.title} (already exists or error)`);
      }
    }

    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
