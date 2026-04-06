import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const sampleIncidents = [
  {
    slug: 'aws-s3-outage-2023',
    title: 'AWS S3 Regional Outage',
    context: 'Major cloud provider infrastructure issue affecting multiple regions',
    what_happened: 'S3 service became unavailable in us-east-1 and us-west-2 regions for 2 hours due to a misconfigured traffic router during a routine deployment.',
    root_cause: 'Incomplete validation in the automated deployment pipeline allowed a configuration with incorrect routing rules to reach production.',
    impact: 'Thousands of applications experienced service degradation. Estimated losses exceeded $50 million across affected businesses.',
    fix: 'AWS engineers manually rolled back the deployment and restored the previous configuration. Implemented immediate traffic failover to backup routers.',
    lessons: 'Deployment validation must include end-to-end testing of critical paths. The blast radius of changes should be limited through canary deployments.',
    prevention: 'Implement stricter pre-deployment validation. Use canary deployments to gradually roll out infrastructure changes. Improve alerting on traffic anomalies.',
    tags: ['infrastructure', 'cloud', 'deployment', 'aws'],
    cost_estimate: 50000000
  },
  {
    slug: 'dns-cache-poisoning-2022',
    title: 'DNS Cache Poisoning Attack',
    context: 'Security incident affecting DNS resolution for a major e-commerce platform',
    what_happened: 'Attackers exploited a vulnerability in DNS caching layer, injecting malicious IP addresses that redirected users to phishing sites for 4 hours.',
    root_cause: 'DNS server validation wasn\'t checking DNSSEC signatures properly. The security team had disabled strict validation to improve performance.',
    impact: 'Over 100,000 users were redirected to phishing sites. Approximately 5,000 accounts were compromised with leaked credentials.',
    fix: 'Immediately reverted DNS validation settings to strict mode. Issued security patches and coordinated with ISPs to clear cached entries.',
    lessons: 'Performance optimizations should never compromise security. DNSSEC validation is critical infrastructure that must always be enforced.',
    prevention: 'Re-enable DNSSEC validation and use hardware security modules (HSMs) for DNS signing. Implement real-time monitoring of DNS response patterns.',
    tags: ['security', 'dns', 'incident-response', 'web-services'],
    cost_estimate: 2000000
  },
  {
    slug: 'database-cascading-delete-2021',
    title: 'Database Cascading Delete Bug',
    context: 'Data loss incident due to cascading foreign key constraints',
    what_happened: 'A developer accidentally deleted a parent record during maintenance. Due to cascading delete rules, this removed 10 million related customer records.',
    root_cause: 'Cascading deletes were enabled by default on all foreign keys. No confirmation prompts or soft-delete logic was in place. The staging environment didn\'t replicate the full data.',
    impact: 'Loss of 10 million customer records including their transaction history and profile data. Business lost approximately $15 million in revenue.',
    fix: 'Restored database from backup from 6 hours prior. Manually reconstructed 2 million records from transaction logs.',
    lessons: 'Cascading deletes are dangerous and should be carefully evaluated. Soft deletes provide safer alternatives. Staging data should match production volume.',
    prevention: 'Implement soft delete strategy for all business-critical data. Require explicit confirmation for delete operations in production. Use database roles with limited privileges.',
    tags: ['database', 'data-loss', 'devops', 'human-error'],
    cost_estimate: 15000000
  },
  {
    slug: 'memory-leak-mobile-app-2023',
    title: 'Mobile App Memory Leak Leading to Crashes',
    context: 'Production mobile application experiencing widespread crashes after update',
    what_happened: 'New feature for real-time notifications stored event listeners indefinitely. Over 24 hours, memory usage grew from 50MB to 500MB, causing out-of-memory crashes.',
    root_cause: 'Event listeners were never unsubscribed in the component cleanup function. The developer assumed the garbage collector would handle it.',
    impact: 'App became unusable for millions of users. 2-star rating on app stores, 50% uninstall rate within 48 hours.',
    fix: 'Immediately released hotfix that properly cleaned up event listeners on component unmount. Pushed update out through emergency deployment.',
    lessons: 'Manual memory management is critical in mobile development. Event listeners must always have corresponding cleanup handlers.',
    prevention: 'Implement memory profiling in CI/CD pipeline. Use automated leak detection tools. Add lifecycle hooks for resource cleanup.',
    tags: ['mobile', 'performance', 'memory-management', 'notifications'],
    cost_estimate: 8000000
  },
  {
    slug: 'rate-limiting-bypass-2022',
    title: 'Rate Limiting Bypass Leading to DDoS',
    context: 'API rate limiting rules were improperly configured',
    what_happened: 'Rate limiting was implemented at the application level but didn\'t account for traffic routed through different headers. Attackers used X-Forwarded-For headers to bypass limits.',
    root_cause: 'Rate limiting logic checked one user header but attackers spoofed alternative headers. No network-level rate limiting was in place as fallback.',
    impact: 'API server received 10 million requests/minute, causing service unavailability for 3 hours. Revenue loss estimated at $2.5 million.',
    fix: 'Implemented rate limiting at multiple layers: network edge, load balancer, and application. Normalized and validated all forwarded headers.',
    lessons: 'Rate limiting must be enforced at network edge, not just application level. Client headers can be spoofed and must be validated.',
    prevention: 'Use WAF and network-level DDoS protection. Implement defense in depth with multiple rate limiting layers. Monitor for suspicious header patterns.',
    tags: ['security', 'api', 'performance', 'ddos'],
    cost_estimate: 2500000
  }
];

async function initializeDatabase() {
  try {
    console.log('[v0] Starting database initialization...');

    // Check if table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'incidents'
      );
    `;

    if (tableCheck[0].exists) {
      console.log('[v0] Table already exists, clearing data...');
      await sql`DELETE FROM incidents;`;
    } else {
      console.log('[v0] Creating incidents table...');
      await sql`
        CREATE TABLE incidents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          context TEXT NOT NULL,
          what_happened TEXT NOT NULL,
          root_cause TEXT NOT NULL,
          impact TEXT NOT NULL,
          fix TEXT NOT NULL,
          lessons TEXT NOT NULL,
          prevention TEXT NOT NULL,
          tags TEXT[] DEFAULT ARRAY[]::TEXT[],
          cost_estimate INTEGER,
          upvotes INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('[v0] Table created successfully');
    }

    // Seed sample data
    console.log('[v0] Seeding sample data...');
    for (const incident of sampleIncidents) {
      await sql`
        INSERT INTO incidents (
          slug, title, context, what_happened, root_cause, impact, fix, lessons, prevention, tags, cost_estimate
        ) VALUES (
          ${incident.slug},
          ${incident.title},
          ${incident.context},
          ${incident.what_happened},
          ${incident.root_cause},
          ${incident.impact},
          ${incident.fix},
          ${incident.lessons},
          ${incident.prevention},
          ${incident.tags},
          ${incident.cost_estimate}
        );
      `;
    }

    console.log('[v0] Database initialization complete! Seeded 5 incidents.');
  } catch (error) {
    console.error('[v0] Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
