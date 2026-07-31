'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type AttendanceRow = {
  id: number;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
};

export default function EmployeeAttendancePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadAttendance();
  }, []);

  async function loadAttendance() {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const currentUserId = authData.user?.id ?? null;
      setUserId(currentUserId);

      if (!currentUserId) {
        setAttendance(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];

      const { data, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', currentUserId)
        .eq('date', today)
        .order('id', { ascending: false })
        .limit(1);

      if (attendanceError) throw attendanceError;

      setAttendance((data as AttendanceRow[] | null)?.[0] ?? null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!userId) {
      setError('You must be logged in to check in.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const checkInTimestamp = new Date().toISOString();

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: today,
          check_in: checkInTimestamp,
        })
        .select('*')
        .single();

      if (error) throw error;

      setAttendance(data as AttendanceRow);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to check in.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCheckOut() {
    if (!userId || !attendance?.id) {
      setError('No active attendance record found for today.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const checkOutTimestamp = new Date().toISOString();

      const { data, error } = await supabase
        .from('attendance')
        .update({
          check_out: checkOutTimestamp,
        })
        .eq('id', attendance.id)
        .select('*')
        .single();

      if (error) throw error;

      setAttendance(data as AttendanceRow);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to check out.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: 24 }}>
      <h1>Attendance</h1>

      {error && (
        <div style={{ marginBottom: 16, color: 'crimson', background: '#ffe5e5', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading attendance...</p>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <strong>Status:</strong>{' '}
            {attendance?.check_in && !attendance?.check_out
              ? 'Checked in'
              : attendance?.check_out
                ? 'Checked out'
                : 'Not checked in'}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleCheckIn}
              disabled={saving || Boolean(attendance?.check_in)}
              style={{ padding: '10px 16px', cursor: 'pointer' }}
            >
              {saving ? 'Working...' : 'Check In'}
            </button>

            <button
              onClick={handleCheckOut}
              disabled={saving || !attendance?.check_in || Boolean(attendance?.check_out)}
              style={{ padding: '10px 16px', cursor: 'pointer' }}
            >
              {saving ? 'Working...' : 'Check Out'}
            </button>
          </div>

          {attendance && (
            <div style={{ marginTop: 20, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
              <p><strong>Date:</strong> {attendance.date}</p>
              <p><strong>Check In:</strong> {attendance.check_in ?? '—'}</p>
              <p><strong>Check Out:</strong> {attendance.check_out ?? '—'}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}