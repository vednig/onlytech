"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface IncidentCardProps {
  slug: string;
  title: string;
  context: string;
  upvotes: number;
  tags: string[];
  createdAt: Date | string;
  costEstimate?: number | null;
  disableLink?: boolean;
}

export function IncidentCard({
  slug,
  title,
  context,
  upvotes,
  tags,
  createdAt,
  costEstimate,
  disableLink,
}: IncidentCardProps) {
  const date = new Date(createdAt);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const router = useRouter();

  const onClick = () => {
    if (!disableLink) router.push(`/incident/${slug}`);
  };

  return (
    <article
      className="block border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
      onClick={onClick}
      role={disableLink ? 'article' : 'link'}
      tabIndex={disableLink ? -1 : 0}
      onKeyDown={(e) => {
        if (!disableLink && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          router.push(`/incident/${slug}`);
        }
      }}
    >
      <div className="flex justify-between items-start gap-4 mb-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex-1 hover:underline">
          <Link href={`/incident/${slug}`} className="hover:underline">
            {title}
          </Link>
        </h2>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {upvotes} {upvotes === 1 ? 'upvote' : 'upvotes'}
          </div>
          {costEstimate && (
            <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
              ${(costEstimate / 1000).toFixed(0)}k
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
        {context}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex gap-1 flex-wrap">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 text-xs rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-500 whitespace-nowrap ml-2">
          {timeAgo}
        </span>
      </div>
    </article>
  );
}
