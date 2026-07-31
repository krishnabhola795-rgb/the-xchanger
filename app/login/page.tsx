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
    <div style={{maxWidth: 420, margin: '4rem auto', padding: 20}}>
      <h1>{isSignup ? 'Sign Up' : 'Log In'}</h1>
      <form onSubmit={handleSubmit}>
        <label style={{display: 'block', marginBottom: 8}}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{width: '100%', padding: 8, marginTop: 4}}
          />
        </label>

        <label style={{display: 'block', marginBottom: 8}}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{width: '100%', padding: 8, marginTop: 4}}
          />
        </label>

        {error && <div style={{color: 'red', marginBottom: 8}}>{error}</div>}

        <button type="submit" disabled={loading} style={{padding: '8px 16px'}}>
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <p style={{marginTop: 12}}>
        <button
          onClick={() => setIsSignup(!isSignup)}
          style={{background: 'none', border: 'none', color: 'blue', cursor: 'pointer', padding: 0}}
        >
          {isSignup ? 'Have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </p>
    </div>
  );
}
