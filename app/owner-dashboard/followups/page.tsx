'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type FollowupRow = {
  id: number;
  assigned_to: string | null;
  scheduled_time: string | null;
  status: string | null;
  notes: string | null;
  customers?: {
    name: string | null;
    phone: string | null;
    interested_car_id: number | null;
  } | null;
};

type EmployeeOption = {
  id: string;
  name: string | null;
};

type CarOption = {
  id: number;
  name: string | null;
};

function formatDisplayTime(value: string | null | undefined) {
  if (!value) return '—';

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) return value;

  const timestampValue = value;
  return new Date(timestampValue).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function OwnerFollowupsPage() {
  const [followups, setFollowups] = useState<FollowupRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [carNames, setCarNames] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFollowups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [followupsResult, employeesResult, carsResult] = await Promise.all([
        supabase
          .from('followups')
          .select('id, assigned_to, scheduled_time, status, notes, customers(name, phone, interested_car_id)')
          .order('scheduled_time', { ascending: false }),
        supabase.from('users').select('id, name').eq('role', 'employee').order('name', { ascending: true }),
        supabase.from('cars').select('id, name').order('name', { ascending: true }),
      ]);

      if (followupsResult.error) throw followupsResult.error;
      if (employeesResult.error) throw employeesResult.error;
      if (carsResult.error) throw carsResult.error;

      const receivedFollowups = (followupsResult.data as unknown as FollowupRow[] | null) ?? [];
      const receivedEmployees = (employeesResult.data as EmployeeOption[] | null) ?? [];
      const receivedCars = (carsResult.data as CarOption[] | null) ?? [];

      const carMap = receivedCars.reduce<Record<number, string>>((accumulator, car) => {
        if (car.id != null && car.name) {
          accumulator[car.id] = car.name;
        }
        return accumulator;
      }, {});

      setFollowups(receivedFollowups);
      setEmployees(receivedEmployees);
      setCarNames(carMap);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load follow-ups.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFollowups();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadFollowups]);

  const visibleFollowups = followups.filter((followup) => {
    const matchesStatus =
      statusFilter === 'all' || (followup.status ?? 'pending').toLowerCase() === statusFilter;
    const matchesEmployee = employeeFilter === 'all' || followup.assigned_to === employeeFilter;

    return matchesStatus && matchesEmployee;
  });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">Team follow-ups</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">All customer follow-ups</h2>
          <p className="mt-1 text-sm text-slate-500">Review every scheduled follow-up across employees in one place.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | 'pending' | 'done')}
              className="min-w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>
          </label>

          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">Employee</span>
            <select
              value={employeeFilter}
              onChange={(event) => setEmployeeFilter(event.target.value)}
              className="min-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All employees</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name ?? 'Unnamed employee'}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading follow-ups...</p>
      ) : visibleFollowups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No follow-ups match the selected filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Interested Car</th>
                  <th className="px-4 py-3">Scheduled Date/Time</th>
                  <th className="px-4 py-3">Assigned Employee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {visibleFollowups.map((followup) => {
                  const employeeName = employees.find((employee) => employee.id === followup.assigned_to)?.name ?? 'Unassigned';
                  const customerName = followup.customers?.name ?? 'Customer';
                  const customerPhone = followup.customers?.phone ?? '—';
                  const interestedCarId = followup.customers?.interested_car_id;
                  const interestedCarName = interestedCarId != null ? carNames[interestedCarId] ?? '—' : '—';

                  return (
                    <tr key={followup.id} className="align-top">
                      <td className="px-4 py-3 font-medium text-slate-900">{customerName}</td>
                      <td className="px-4 py-3 text-slate-600">{customerPhone}</td>
                      <td className="px-4 py-3 text-slate-600">{interestedCarName}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDisplayTime(followup.scheduled_time)}</td>
                      <td className="px-4 py-3 text-slate-600">{employeeName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            (followup.status ?? 'pending').toLowerCase() === 'done'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {(followup.status ?? 'pending').toLowerCase() === 'done' ? 'Done' : 'Pending'}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-4 py-3 text-slate-600">{followup.notes?.trim() ? followup.notes : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
