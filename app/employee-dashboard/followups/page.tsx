'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type FollowupRow = {
  id: number;
  customer_id: number | null;
  assigned_to: string | null;
  scheduled_time: string | null;
  status: string | null;
  customers?: {
    name: string | null;
    phone: string | null;
  } | null;
};

export default function EmployeeFollowupsPage() {
  const [followups, setFollowups] = useState<FollowupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadFollowups();
  }, []);

  async function loadFollowups() {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) {
        setFollowups([]);
        return;
      }

      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

      const { data, error: followupError } = await supabase
        .from('followups')
        .select('id, customer_id, assigned_to, scheduled_time, status, customers(name, phone)')
        .eq('assigned_to', userId)
        .gte('scheduled_time', start)
        .lte('scheduled_time', end)
        .order('scheduled_time', { ascending: true });

      if (followupError) throw followupError;

      setFollowups((data as unknown as FollowupRow[]) ?? []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkDone(id: number) {
    setSavingId(id);
    setError(null);

    try {
      const { error } = await supabase
        .from('followups')
        .update({ status: 'done' })
        .eq('id', id);

      if (error) throw error;

      setFollowups((current) => current.filter((followup) => followup.id !== id));
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to mark follow-up as done.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading follow-ups...</p>
        ) : followups.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">No follow-ups scheduled for today.</div>
        ) : (
          followups.map((followup) => (
            <div key={followup.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{followup.customers?.name ?? 'Customer'}</p>
                  <p className="mt-1 text-sm text-slate-500">Phone: {followup.customers?.phone ?? '—'}</p>
                  <p className="mt-1 text-sm text-slate-500">Time: {followup.scheduled_time ? new Date(followup.scheduled_time).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }) : '—'}</p>
                  <p className="mt-1 text-sm text-slate-500">Status: {followup.status ?? '—'}</p>
                </div>

                <button
                  onClick={() => void handleMarkDone(followup.id)}
                  disabled={savingId === followup.id}
                  className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {savingId === followup.id ? 'Working...' : 'Mark Done'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
  );
}
