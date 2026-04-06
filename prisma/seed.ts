import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.incident.deleteMany({});

  const incidents = [
    {
      slug: 'we-accidentally-spent-48000-on-logs',
      title: 'We accidentally spent $48,000 on logs',
      context:
        'Kubernetes + Fluentd shipping everything to Datadog with debug level enabled after a hotfix. 40 services, 12 clusters.',
      whatHappened:
        'A rollout toggled debug logging globally. No retention limits or budget alerts were set. Overnight ingestion hit 12 TB, triggering on-demand overages.',
      rootCause:
        'Missing guardrails on logging configs; no per-namespace limits; change merged without SRE review.',
      impact:
        '$48k spend in 9 hours; ingestion throttling caused partial observability gaps during an unrelated incident.',
      fix: 'Reverted logging config, set per-namespace caps, added budget alerts and log sampling.',
      lessons: [
        'Ship less by default—sample debug logs.',
        'Budget alerts on observability spend are mandatory.',
        'Require SRE review for cluster-wide config changes.',
      ],
      prevention: [
        'Enforce log retention + volume caps.',
        'Add canary rollout for logging DaemonSets.',
        'Create runbook for emergency log throttling.',
      ],
      tags: ['aws', 'logging', 'billing', 'kubernetes'],
      costEstimate: 48000,
      upvotes: 120,
    },
    {
      slug: 'cron-job-deleted-production-3am',
      title: 'A cron job deleted production at 3AM',
      context: 'Legacy Rails monolith, single Postgres primary, nightly cron for cleanup.',
      whatHappened:
        'A mis-scoped DELETE without WHERE ran after a column rename. Replication dutifully propagated the truncate-like delete.',
      rootCause:
        'Lack of safe-guarded migrations, missing WHERE linting, no read-replicas for recovery.',
      impact: '3 hours downtime, partial data loss, $25k customer credits.',
      fix: 'Restored from WAL backups, added statement timeout + pg_repack, implemented soft-deletes.',
      lessons: [
        'DELETEs must be feature-flagged and limited.',
        'Schema changes require paired data backfills.',
        'Have PITR tested monthly.',
      ],
      prevention: [
        'Use read-replica canaries for migrations.',
        'Adopt safe-migrate tooling with WHERE requirements.',
        'Automate PITR drills.',
      ],
      tags: ['database', 'human-error', 'postgres', 'backups'],
      costEstimate: 25000,
      upvotes: 98,
    },
    {
      slug: 'dns-ttl-misfire-global-outage',
      title: 'DNS TTL misfire caused global outage',
      context: 'Edge network with multiple CDNs; marketing cutover scheduled during peak.',
      whatHappened:
        'A TXT record edit accidentally set the apex A record to a staging IP. With 30s TTL, caches oscillated and clients flapped between envs.',
      rootCause:
        'Manual DNS edits without review; shared account; no config as code.',
      impact: '50-minute outage; 17% revenue drop for the day; broken OAuth redirects.',
      fix: 'Reverted to previous zone file, moved DNS to Terraform, added dual-authorization for apex changes.',
      lessons: ['Treat DNS as code.', 'Use change windows for apex edits.', 'Short TTLs still hurt when wrong.'],
      prevention: ['Require reviews on DNS IaC.', 'Set up DNS diff previews.', 'Add DNS synthetic checks.'],
      tags: ['dns', 'infra', 'human-error'],
      costEstimate: 120000,
      upvotes: 210,
    },
    {
      slug: 'certificate-expired-once-took-down-api',
      title: 'Expired TLS certificate took down the public API',
      context: 'Node + Nginx API gateway; certs issued via manual ACM requests.',
      whatHappened:
        'Renewal email missed; cert expired over weekend; clients rejected TLS handshake.',
      rootCause: 'Manual cert lifecycle, no monitoring on expiry, single engineer responsibility.',
      impact: '2.5 hours API downtime; SLA penalties and incident cost ~$15k.',
      fix: 'Issued new cert, automated renewals with Let’s Encrypt via DNS-01, added expiry alerts.',
      lessons: [
        'Never run manual cert renewals.',
        'Add expiry alerts 30/7/1 days before.',
        'Have secondary on-call for cert ownership.',
      ],
      prevention: [
        'ACME automation in CI.',
        'Dashboards tracking cert expirations.',
        'Runbook for cert failures.',
      ],
      tags: ['security', 'availability', 'ops'],
      costEstimate: 15000,
      upvotes: 75,
    },
    {
      slug: 'kafka-retention-blew-up-disk',
      title: 'Kafka retention misconfig filled brokers',
      context: 'Self-hosted Kafka cluster; retention.ms increased for a single topic without storage rebalancing.',
      whatHappened:
        'Retention bump from 2 days to 14 days on a high-throughput topic filled disks in 6 hours, triggering ISR thrash and consumer lag.',
      rootCause:
        'Change bypassed capacity planning; no per-topic quotas; alert thresholds too high.',
      impact: 'Ingest pipeline stalled; downstream analytics 12 hours late; manual cleanup required.',
      fix: 'Reduced retention, expanded brokers, rebalanced partitions, added disk auto-scaling.',
      lessons: [
        'Retention changes require capacity review.',
        'Set per-topic quotas and disk alerts.',
        'Test retention in staging clusters.',
      ],
      prevention: [
        'Quota guardrails for topic owners.',
        'Auto-reject risky retention PRs.',
        'Storage runbooks with fast rollback.',
      ],
      tags: ['scaling', 'infra', 'kafka', 'billing'],
      costEstimate: 60000,
      upvotes: 132,
    },
  ];

  for (const incident of incidents) {
    await prisma.incident.create({ data: incident });
  }

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

