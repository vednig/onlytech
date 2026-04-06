'use client';

import type React from 'react';
import { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { getOrCreateSession } from '@/lib/supabase-browser';

interface UpvoteButtonProps {
  slug: string;
  initialUpvotes: number;
}

export function UpvoteButton({ slug, initialUpvotes }: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setError('Sign in to upvote');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/incidents/${slug}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setUpvotes((prev) => prev + 1);
      } else if (response.status === 409) {
        setError('Already upvoted');
      } else if (response.status === 401) {
        setError('Sign in required');
      } else {
        setError('Failed to upvote');
      }
    } catch (error) {
      console.error('Failed to upvote:', error);
      setError('Failed to upvote');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        onClick={handleUpvote}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 transition-colors"
      >
        <ThumbsUp className="w-4 h-4" />
        <span className="text-sm font-medium">{upvotes}</span>
      </button>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

async function getAccessToken(): Promise<string | null> {
  const session = await getOrCreateSession();
  return session?.access_token ?? null;
}
