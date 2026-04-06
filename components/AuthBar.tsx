'use client';

import { useEffect, useState } from 'react';
import { supabaseBrowser, getOrCreateSession } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';

type Status =
  | { state: 'signed-out' }
  | { state: 'anon'; userId: string }
  | { state: 'email'; userId: string; email?: string };

export function AuthBar() {
  const [status, setStatus] = useState<Status>({ state: 'signed-out' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabaseBrowser) return;
    supabaseBrowser.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      const isAnon = session.user?.is_anonymous;
      setStatus({
        state: isAnon ? 'anon' : 'email',
        userId: session.user.id,
        email: session.user.email ?? undefined,
      });
    });
  }, []);

  const signInAnon = async () => {
    if (!supabaseBrowser) return alert('Supabase not configured');
    setLoading(true);
    const { data, error } = await supabaseBrowser.auth.signInAnonymously();
    setLoading(false);
    if (error) return alert(error.message);
    if (data.session?.user) {
      setStatus({ state: 'anon', userId: data.session.user.id });
    }
  };

  const signInEmail = async () => {
    if (!supabaseBrowser) return alert('Supabase not configured');
    const email = window.prompt('Enter your email for a magic link');
    if (!email) return;
    setLoading(true);
    const { error } = await supabaseBrowser.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    setLoading(false);
    if (error) return alert(error.message);
    alert('Check your email for a sign-in link.');
  };

  const signOut = async () => {
    if (!supabaseBrowser) return;
    const { data } = await supabaseBrowser.auth.getSession();
    const isAnon = data.session?.user?.is_anonymous;
    if (isAnon) {
      // Keep anon session tokens so identity is reused; just hide UI state
      setStatus({ state: 'signed-out' });
      return;
    }
    await supabaseBrowser.auth.signOut();
    // After email logout, try to fall back to stored anon session (same identity as earlier)
    const anon = await getOrCreateSession();
    if (anon?.user?.is_anonymous) {
      setStatus({ state: 'anon', userId: anon.user.id });
    } else {
      setStatus({ state: 'signed-out' });
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
      {status.state === 'signed-out' && (
        <>
          <Button size="sm" variant="outline" onClick={signInAnon} disabled={loading}>
            Continue anonymously
          </Button>
          <Button size="sm" variant="ghost" onClick={signInEmail} disabled={loading}>
            Email link
          </Button>
        </>
      )}
      {status.state === 'anon' && (
        <>
          <span>Anon session</span>
          <Button size="sm" variant="ghost" onClick={signInEmail} disabled={loading}>
            Upgrade to email
          </Button>
          <Button size="sm" variant="outline" onClick={signOut} disabled={loading}>
            Sign out
          </Button>
        </>
      )}
      {status.state === 'email' && (
        <>
          <span>{status.email ?? 'Signed in'}</span>
          <Button size="sm" variant="outline" onClick={signOut} disabled={loading}>
            Sign out
          </Button>
        </>
      )}
    </div>
  );
}
