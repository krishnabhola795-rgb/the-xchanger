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
    <div style={{ maxWidth: 900, margin: '2rem auto', padding: 24 }}>
      <h1>Today's Follow-ups</h1>

      {error && (
        <div style={{ marginBottom: 16, color: 'crimson', background: '#ffe5e5', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading follow-ups...</p>
      ) : followups.length === 0 ? (
        <p>No follow-ups scheduled for today.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
          {followups.map((followup) => (
            <li key={followup.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 6px' }}><strong>Customer:</strong> {followup.customers?.name ?? '—'}</p>
                  <p style={{ margin: '0 0 6px' }}><strong>Phone:</strong> {followup.customers?.phone ?? '—'}</p>
                  <p style={{ margin: 0 }}><strong>Time:</strong> {followup.scheduled_time ? new Date(followup.scheduled_time).toLocaleString() : '—'}</p>
                  <p style={{ margin: '6px 0 0' }}><strong>Status:</strong> {followup.status ?? '—'}</p>
                </div>

                <button
                  onClick={() => void handleMarkDone(followup.id)}
                  disabled={savingId === followup.id}
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                >
                  {savingId === followup.id ? 'Working...' : 'Mark Done'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
