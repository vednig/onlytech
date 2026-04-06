import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { UpvoteButton } from '@/components/UpvoteButton';
import { prisma } from '@/lib/prisma';
import { IncidentCard } from '@/components/IncidentCard';
import { CommentsSection } from '@/components/CommentsSection';
import { incidentOg } from '@/lib/og';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const incident = await prisma.incident.findFirst({ where: { slug, published: true } });
  if (!incident) {
    return { title: 'Incident Not Found - OnlyTech.boo' };
  }

  return {
    title: `${incident.title} - OnlyTech.boo`,
    description: incident.context,
    openGraph: {
      title: incident.title,
      description: incident.context,
      images: [incidentOg(slug)],
    },
    twitter: {
      card: 'summary_large_image',
      images: [incidentOg(slug)],
      title: incident.title,
      description: incident.context,
    },
  };
}

export default async function IncidentPage({ params }: PageProps) {
  const { slug } = await params;

  if (!process.env.DATABASE_URL) {
    return (
      <main className="min-h-screen bg-white dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 py-12">
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

  const incident = await prisma.incident.findFirst({ where: { slug, published: true } });

  if (!incident) notFound();

  const similar = await prisma.incident.findMany({
    where: {
      slug: { not: slug },
      tags: { hasSome: incident.tags },
      published: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  const formattedDate = new Date(incident.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-950 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to incidents
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            {incident.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{formattedDate}</span>
            {incident.costEstimate && (
              <span className="text-sm font-semibold bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                ${(incident.costEstimate / 1000).toFixed(0)}k estimated cost
              </span>
            )}
          </div>

          {incident.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {incident.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1 rounded text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div>
            <UpvoteButton slug={slug} initialUpvotes={incident.upvotes} />
          </div>
        </div>

        <div className="space-y-8 text-zinc-900 dark:text-zinc-100">
          {incident.context && (
            <Section title="Context" content={incident.context} />
          )}
          {incident.whatHappened && (
            <Section title="What Happened" content={incident.whatHappened} />
          )}
          {incident.rootCause && (
            <Section title="Root Cause" content={incident.rootCause} />
          )}
          {incident.impact && <Section title="Impact" content={incident.impact} />}
          {incident.fix && <Section title="Fix" content={incident.fix} />}
          {incident.lessons.length > 0 && (
            <ListSection title="Lessons Learned" items={incident.lessons} />
          )}
          {incident.prevention.length > 0 && (
            <ListSection title="Prevention" items={incident.prevention} />
          )}
        </div>

        {similar.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Similar incidents
            </h3>
            <div className="space-y-2">
              {similar.map((inc) => (
                <IncidentCard
                  key={inc.slug}
                  slug={inc.slug}
                  title={inc.title}
                  context={inc.context}
                  upvotes={inc.upvotes}
                  tags={inc.tags}
                  createdAt={inc.createdAt}
                  costEstimate={inc.costEstimate}
                  disableLink
                />
              ))}
            </div>
          </div>
        )}

        <CommentsSection slug={slug} />

        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to incidents
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{content}</p>
    </section>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-3">{title}</h2>
      <ul className="list-disc pl-5 space-y-2 text-zinc-700 dark:text-zinc-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
