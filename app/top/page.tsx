import Link from 'next/link';
import { IncidentCard } from '@/components/IncidentCard';
import { prisma } from '@/lib/prisma';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Top costly incidents – OnlyTech.boo',
  description: 'Highest reported cost incidents, sorted by estimated loss.',
};

export default async function TopCostlyPage() {
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

  const incidents = await prisma.incident.findMany({
    orderBy: { costEstimate: 'desc' },
    take: 20,
    where: { costEstimate: { not: null }, published: true },
  });

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

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Top costly mistakes
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sorted by estimated financial impact.
          </p>
        </div>

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
      </div>
    </main>
  );
}
