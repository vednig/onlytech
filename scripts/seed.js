const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.incident.deleteMany({});

  // Create seed incidents
  const incidents = [
    {
      slug: 'aws-s3-bucket-deleted-2024',
      title: 'AWS S3 Bucket Accidentally Deleted',
      context:
        'A startup was storing all user documents in a single S3 bucket without versioning enabled.',
      whatHappened:
        'A developer with admin AWS credentials accidentally ran terraform destroy in the wrong environment, deleting the entire S3 bucket containing 6 months of user data.',
      rootCause:
        'No environment separation, admin credentials shared across environments, no bucket deletion protection, no backups.',
      impact:
        'Lost all user documents, 2 weeks of downtime, customer data breach, $50k in compensation.',
      fix:
        'Restored from CloudTrail logs and working with AWS support to recover deleted objects. Implemented bucket versioning and deletion protection.',
      lessons:
        'Always use environment separation, never share credentials, enable MFA for destructive operations, maintain backups.',
      prevention:
        'Implement least-privilege IAM, enable S3 Object Lock, use Terraform workspaces, maintain automated backups to separate account.',
      tags: ['AWS', 'Data Loss', 'DevOps', 'Critical'],
      costEstimate: 250000,
      upvotes: 342,
    },
    {
      slug: 'dns-misconfiguration-outage-2024',
      title: 'DNS Misconfiguration Caused Global Outage',
      context:
        'A SaaS platform migrated its DNS provider and made changes to propagate DNS records across multiple regions.',
      whatHappened:
        'During the DNS migration, a typo in the zone file caused all traffic to resolve to the wrong IP address. The service was unreachable for 3 hours before being noticed.',
      rootCause:
        'Manual DNS configuration without validation, no staging DNS environment, insufficient monitoring of DNS changes.',
      impact:
        '3 hour complete outage, 500+ customers unable to access service, $100k+ in SLA credits.',
      fix:
        'Reverted DNS changes to previous configuration, migrated back to original provider, implemented DNS health checks.',
      lessons:
        'Always validate DNS changes in staging, use Infrastructure as Code for DNS, implement real-time DNS monitoring.',
      prevention:
        'Use DNS provider APIs with validation, test DNS changes before production, set up alerts for TTL changes and record modifications.',
      tags: ['DNS', 'Infrastructure', 'Outage', 'Critical'],
      costEstimate: 150000,
      upvotes: 287,
    },
    {
      slug: 'rate-limiting-failure-api-2024',
      title: 'Rate Limiting Bug Caused API Cascade Failure',
      context:
        'An API service had a rate limiting middleware that was supposed to protect against DDoS attacks and excessive usage.',
      whatHappened:
        'A bug in the rate limiting logic caused it to block ALL requests after 100 valid requests, instead of just those exceeding the limit. The service became completely unavailable.',
      rootCause:
        'Off-by-one error in rate limiting counter, insufficient test coverage for edge cases, no staged rollout.',
      impact:
        '45 minutes of complete API outage, cascading failures in dependent services, customer apps unable to function.',
      fix:
        'Rolled back the rate limiting middleware, hotfixed the counter logic, deployed with feature flags.',
      lessons:
        'Test rate limiting extensively with edge cases, use feature flags for middleware changes, implement circuit breakers.',
      prevention:
        'Add comprehensive tests for rate limiting, use canary deployments, implement request tracing for debugging.',
      tags: ['API', 'Bug', 'Infrastructure', 'Outage'],
      costEstimate: 75000,
      upvotes: 198,
    },
    {
      slug: 'database-connection-pool-exhaustion-2024',
      title: 'Database Connection Pool Exhaustion',
      context:
        'A payment processing service started experiencing slow transactions after deploying a new version of the application.',
      whatHappened:
        'The new deployment introduced a subtle connection leak in the ORM query builder. Connections were opened but never returned to the pool. Within 30 minutes, all 100 connections were exhausted, causing all queries to timeout.',
      rootCause:
        'Connection not properly closed in error handling path, insufficient connection pool monitoring, no tests for connection lifecycle.',
      impact:
        'Payment processing delayed for 2+ hours, customers unable to complete transactions, lost revenue.',
      fix:
        'Identified and fixed the connection leak, manually recycled the connection pool, deployed hotfix.',
      lessons:
        'Always monitor connection pool usage in production, implement connection lifecycle tests, use connection pooling best practices.',
      prevention:
        'Set up alerts for connection pool utilization, enforce connection closing in code reviews, use ORM connection testing utilities.',
      tags: ['Database', 'Scaling', 'Performance', 'DevOps'],
      costEstimate: 45000,
      upvotes: 156,
    },
    {
      slug: 'zero-trust-security-breach-2024',
      title: 'Compromised Employee Credentials Led to Data Breach',
      context:
        'A company was using basic username/password authentication for internal admin tools with no additional security controls.',
      whatHappened:
        'An employee\'s credentials were leaked on GitHub. An attacker used these credentials to access the internal admin portal and exfiltrated customer data for 10,000+ users.',
      rootCause:
        'No MFA on admin accounts, no IP whitelisting, no audit logging, credentials hardcoded in config files.',
      impact:
        'Data breach affecting 10,000+ users, GDPR fines, regulatory investigation, loss of customer trust.',
      fix:
        'Immediately revoked compromised credentials, isolated affected systems, notified users, implemented incident response.',
      lessons:
        'Always use MFA for sensitive access, implement IP whitelisting, maintain detailed audit logs, never hardcode secrets.',
      prevention:
        'Implement zero-trust architecture, use secret management tools, enable MFA everywhere, monitor for leaked credentials.',
      tags: ['Security', 'Critical', 'Human Error', 'Compliance'],
      costEstimate: 500000,
      upvotes: 421,
    },
  ];

  for (const incident of incidents) {
    await prisma.incident.create({
      data: incident,
    });
  }

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
