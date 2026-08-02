"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function OwnerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [presentCount, setPresentCount] = useState<number>(0);
  const [absentCount, setAbsentCount] = useState<number | null>(null);

  const [carsAvailable, setCarsAvailable] = useState<number>(0);
  const [carsSold, setCarsSold] = useState<number>(0);
  const [carsReserved, setCarsReserved] = useState<number>(0);

  const [todaysFollowups, setTodaysFollowups] = useState<number>(0);
  const [pendingFollowups, setPendingFollowups] = useState<number>(0);

  useEffect(() => {
    void loadCounts();
  }, []);

  async function loadCounts() {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0).toISOString();
      const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

      const [attendanceRes, employeesRes, availableRes, soldRes, reservedRes, todaysFollowupsRes, pendingRes] =
        await Promise.all([
          supabase.from('attendance').select('id,check_in').eq('date', todayDate),
          supabase.from('users').select('id', { count: 'exact' }).eq('role', 'employee'),
          supabase.from('cars').select('id', { count: 'exact' }).eq('status', 'available'),
          supabase.from('cars').select('id', { count: 'exact' }).eq('status', 'sold'),
          supabase.from('cars').select('id', { count: 'exact' }).eq('status', 'reserved'),
          supabase.from('followups').select('id').gte('scheduled_time', start).lte('scheduled_time', end),
          supabase.from('followups').select('id', { count: 'exact' }).not('status', 'eq', 'done'),
        ]);

      if (attendanceRes.error) throw attendanceRes.error;
      if (employeesRes.error) throw employeesRes.error;
      if (availableRes.error) throw availableRes.error;
      if (soldRes.error) throw soldRes.error;
      if (reservedRes.error) throw reservedRes.error;
      if (todaysFollowupsRes.error) throw todaysFollowupsRes.error;
      if (pendingRes.error) throw pendingRes.error;

      const attendanceData = attendanceRes.data ?? [];
      const present = attendanceData.filter((r: any) => r.check_in != null).length;
      setPresentCount(present);

      const totalEmployees = employeesRes.count ?? (employeesRes.data?.length ?? null);
      setAbsentCount(totalEmployees == null ? null : Math.max(0, (totalEmployees as number) - present));

      setCarsAvailable(availableRes.count ?? 0);
      setCarsSold(soldRes.count ?? 0);
      setCarsReserved(reservedRes.count ?? 0);

      setTodaysFollowups((todaysFollowupsRes.data ?? []).length);
      setPendingFollowups(pendingRes.count ?? 0);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard counts.');
    } finally {
      setLoading(false);
    }
  }

  function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">Operations snapshot</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Owner Dashboard</h2>
        <p className="mt-2 text-sm text-slate-500">A concise view of your dealership operations.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={`Today's Attendance`}
          value={loading ? '…' : `${presentCount} present`}
          subtitle={absentCount == null ? 'Total employees unknown' : `${absentCount} absent`}
        />

        <StatCard
          title="Total Cars"
          value={loading ? '…' : `${carsAvailable + carsSold + carsReserved}`}
          subtitle={`Available: ${carsAvailable} • Sold: ${carsSold} • Reserved: ${carsReserved}`}
        />

        <StatCard
          title="Today's Follow-ups"
          value={loading ? '…' : todaysFollowups}
          subtitle="Scheduled for today"
        />

        <StatCard
          title="Pending Follow-ups"
          value={loading ? '…' : pendingFollowups}
          subtitle="Not marked done"
        />
      </div>
    </div>
  );
}
