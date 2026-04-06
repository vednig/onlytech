import { Suspense } from 'react';
import { IncidentCard } from '@/components/IncidentCard';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: { tag: string };
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps) {
  return {
    title: `${params.tag} incidents - OnlyTech.boo`,
    description: `Incidents tagged with ${params.tag}`,
  };
}

async function getIncidents(tag: string) {
  return prisma.incident.findMany({
    where: { tags: { has: tag }, published: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export default async function TagPage({ params }: PageProps) {
  if (!process.env.DATABASE_URL) {
    return (
      <main className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Database not configured
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Set DATABASE_URL in .env, run Prisma migrations, then restart the dev server.
          </p>
        </div>
      </main>
    );
  }

  const incidents = await getIncidents(params.tag);

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to incidents
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {params.tag}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Incidents with tag “{params.tag}”.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12">Loading…</div>}>
          <TagList incidents={incidents} />
        </Suspense>
      </div>
    </main>
  );
}

function TagList({ incidents }: { incidents: Awaited<ReturnType<typeof getIncidents>> }) {
  if (incidents.length === 0) {
    return (
      <div className="text-sm text-zinc-500">No incidents found for this tag.</div>
    );
  }

  return (
    <div className="space-y-2">
      {incidents.map((incident) => (
        <IncidentCard
          key={incident.slug}
          slug={incident.slug}
          title={incident.title}
          context={incident.context}
          upvotes={incident.upvotes}
          tags={incident.tags}
          createdAt={incident.createdAt}
          costEstimate={incident.costEstimate}
        />
      ))}
    </div>
  );
}
