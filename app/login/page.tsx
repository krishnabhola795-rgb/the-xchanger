'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!active) return;

        if (sessionError) {
          console.error('Error restoring session:', sessionError);
          setCheckingSession(false);
          return;
        }

        if (session?.user?.id) {
          await fetchRoleAndRedirect(session.user.id);
        } else {
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Error restoring session:', err);
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function fetchRoleAndRedirect(userId: string | undefined) {
    if (!userId) {
      setCheckingSession(false);
      return;
    }

    setCheckingSession(false);

    const { data, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching role:', fetchError);
      setError('Failed to fetch user role.');
      return;
    }

    const role = (data as { role?: string } | null)?.role;
    if (role === 'owner') router.push('/owner-dashboard');
    else if (role === 'employee') router.push('/employee-dashboard');
    else router.push('/');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      await fetchRoleAndRedirect(signInData.user?.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="relative overflow-hidden w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {checkingSession ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">The Xchangers</p>
            <p className="text-base font-medium text-slate-900">Checking your session...</p>
            <p className="text-sm text-slate-500">Please wait while we restore your account.</p>
          </div>
        ) : (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
              <Image
                src="/logo.png"
                alt="The Xchangers watermark"
                width={260}
                height={260}
                className="h-[260px] w-[260px] object-contain"
              />
            </div>
            <div className="relative mb-6 text-center sm:mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">The Xchangers</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-500">Sign in to access your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Please wait...' : 'Log In'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              Owner accounts are created directly in Supabase. If you need access, contact the administrator.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
