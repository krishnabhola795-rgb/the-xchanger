'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatIstDate, formatIstTimestamp } from '../../../lib/dateFormatting';
import { supabase } from '../../../lib/supabaseClient';

type AttendanceRow = {
  id: number;
  user_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
};

function formatDisplayDate(value: string | null | undefined) {
  return formatIstDate(value);
}

function formatDisplayTime(value: string | null | undefined) {
  return formatIstTimestamp(value);
}

export default function EmployeeAttendancePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAttendance();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadAttendance]);

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
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 sm:mb-6">{error}</div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading attendance...</p>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 p-5 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-100">Today</p>
              <p className="mt-2 text-2xl font-semibold">
                {attendance?.check_in && !attendance?.check_out
                  ? 'Checked in'
                  : attendance?.check_out
                    ? 'Checked out'
                    : 'Not checked in'}
              </p>
              <p className="mt-2 text-sm text-indigo-100">Keep your workday moving with a quick tap.</p>
            </div>

            <div className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2">
              <button
                onClick={handleCheckIn}
                disabled={saving || Boolean(attendance?.check_in)}
                className="min-h-[52px] rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Working...' : 'Check In'}
              </button>

              <button
                onClick={handleCheckOut}
                disabled={saving || !attendance?.check_in || Boolean(attendance?.check_out)}
                className="min-h-[52px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Working...' : 'Check Out'}
              </button>
            </div>

            {attendance ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:mt-6">
                <p className="text-sm font-semibold text-slate-900">Today’s attendance details</p>
                <p className="mt-2"><span className="font-medium text-slate-900">Date:</span> {formatDisplayDate(attendance.date)}</p>
                <p className="mt-2"><span className="font-medium text-slate-900">Check In:</span> {formatDisplayTime(attendance.check_in)}</p>
                <p className="mt-2"><span className="font-medium text-slate-900">Check Out:</span> {formatDisplayTime(attendance.check_out)}</p>
              </div>
            ) : null}
          </>
        )}
      </div>
  );
}