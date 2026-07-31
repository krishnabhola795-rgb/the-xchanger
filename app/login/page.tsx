'use client';

import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);

  async function fetchRoleAndRedirect(userId: string | undefined) {
    if (!userId) return;
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

    const role = (data as any)?.role;
    if (role === 'owner') router.push('/owner-dashboard');
    else if (role === 'employee') router.push('/employee-dashboard');
    else router.push('/');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignup) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;

        // If no session returned, attempt to sign in immediately
        if (!signUpData?.user) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
          await fetchRoleAndRedirect(signInData.user?.id);
        } else {
          // if signUp returned user (and maybe session), try to fetch role
          await fetchRoleAndRedirect(signUpData.user?.id);
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        await fetchRoleAndRedirect(signInData.user?.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">The Xchanger</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{isSignup ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignup ? 'Set up your workspace and continue.' : 'Sign in to access your dashboard.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="font-medium text-indigo-600 transition hover:text-indigo-700"
          >
            {isSignup ? 'Have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
