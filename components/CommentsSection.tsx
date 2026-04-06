'use client';

import { useEffect, useMemo, useState } from 'react';
import { getOrCreateSession } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type Comment = {
  id: string;
  incidentId: string;
  parentId: string | null;
  userId: string | null;
  authorName: string | null;
  body: string;
  createdAt: string;
};

export function CommentsSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [slug]);

  const tree = useMemo(() => buildTree(comments), [comments]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/incidents/${slug}/comments`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load comments');
      const data = (await res.json()) as Comment[];
      setComments(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  async function ensureSession(): Promise<string | null> {
    const session = await getOrCreateSession();
    return session?.access_token ?? null;
  }

  async function submit() {
    if (!body.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    setPosting(true);
    setError(null);
    try {
      const token = await ensureSession();
      if (!token) {
        setError('Sign in required');
        setPosting(false);
        return;
      }
      const res = await fetch(`/api/incidents/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          body,
          authorName: authorName.trim() || undefined,
          parentId: replyTo || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to post');
      }
      const newComment = (await res.json()) as Comment;
      setComments((prev) => [...prev, newComment]);
      setBody('');
      setReplyTo(null);
    } catch (err: any) {
      setError(err.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="mt-12 space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Comments</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Oldest first.</p>
      </div>

      <div className="space-y-3">
        <Textarea
          placeholder="Add a comment"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Name (optional)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="max-w-xs"
          />
          {replyTo && (
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Replying to comment…{' '}
              <button className="underline" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </span>
          )}
          <Button onClick={submit} disabled={posting}>
            {posting ? 'Posting…' : 'Post comment'}
          </Button>
        </div>
        {error && <div className="text-xs text-red-500">{error}</div>}
      </div>

      <div className="space-y-4">
        {loading && <div className="text-sm text-zinc-500">Loading comments…</div>}
        {!loading && tree.length === 0 && (
          <div className="text-sm text-zinc-500">No comments yet.</div>
        )}
        {!loading &&
          tree.map((c) => (
            <CommentItem key={c.id} comment={c} onReply={(id) => setReplyTo(id)} />
          ))}
      </div>
    </section>
  );
}

type CommentNode = Comment & { replies: CommentNode[] };

function buildTree(comments: Comment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  comments
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((c) => byId.set(c.id, { ...c, replies: [] }));

  const roots: CommentNode[] = [];
  byId.forEach((c) => {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

function CommentItem({ comment, onReply }: { comment: CommentNode; onReply: (id: string) => void }) {
  const date = new Date(comment.createdAt);
  const heading =
    comment.authorName?.trim() || comment.userId
      ? comment.authorName?.trim() || 'Anonymous user'
      : 'Posted anonymously';
  const timestamp = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded p-3">
      <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium text-zinc-800 dark:text-zinc-100">{heading}</span>
        <span>{timestamp}</span>
      </div>
      <p className="mt-2 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{comment.body}</p>
      <button
        className="mt-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        onClick={() => onReply(comment.id)}
      >
        Reply
      </button>
      {comment.replies.length > 0 && (
        <div className="mt-3 pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-3">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
