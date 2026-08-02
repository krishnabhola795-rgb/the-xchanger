'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';

type Role = 'owner' | 'employee';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryRole = params.get('role');
    if (queryRole === 'owner' || queryRole === 'employee') {
      setSelectedRole(queryRole);
    }
  }, []);

  const roleToUse: Role = selectedRole ?? 'employee';
  const roleLabel = selectedRole ? `${selectedRole.charAt(0).toUpperCase()}${selectedRole.slice(1)}` : 'Employee';

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

        let userId = signUpData?.user?.id;

        if (!userId) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (signInError) throw signInError;
          userId = signInData.user?.id;
        }

        if (userId) {
          const defaultName = email.split('@')[0] || '';
          const { error: userUpsertError } = await supabase.from('users').upsert({
            id: userId,
            name: defaultName,
            email,
            role: roleToUse,
          });
          if (userUpsertError) throw userUpsertError;
        }

        await fetchRoleAndRedirect(userId);
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-3 py-6 sm:px-4 sm:py-10">
      <div className="relative overflow-hidden w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
          <Image
            src="/logo.png"
            alt="The Xchanger watermark"
            width={260}
            height={260}
            className="h-[260px] w-[260px] object-contain"
          />
        </div>
        <div className="relative mb-6 text-center sm:mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-indigo-600">The Xchanger</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isSignup
              ? 'Set up your workspace and continue.'
              : 'Sign in to access your dashboard.'}
          </p>
        </div>

        {!selectedRole ? (
          <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-800">Choose your role</p>
            <p className="mt-2 text-sm text-slate-600">
              Select the role that best matches how you want to use the app. This will be applied during signup and helps route you to the right dashboard.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push('/login?role=owner')}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left text-slate-900 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="text-base font-semibold">Owner</p>
                <p className="mt-1 text-sm text-slate-600">Manage listings, customers, and reports.</p>
              </button>
              <button
                type="button"
                onClick={() => router.push('/login?role=employee')}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left text-slate-900 transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                <p className="text-base font-semibold">Employee</p>
                <p className="mt-1 text-sm text-slate-600">Access attendance, follow-ups, and employee tools.</p>
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-3xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-800">
            Selected role: <span className="font-semibold">{roleLabel}</span>.{' '}
            <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-900">
              Change role
            </Link>
          </div>
        )}

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
