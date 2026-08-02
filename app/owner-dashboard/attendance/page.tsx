'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type AttendanceRow = {
  id: number;
  user_id: string | null;
  date: string | null;
  check_in: string | null;
  check_out: string | null;
  users?: {
    name: string | null;
  } | null;
};

type AttendanceFilter = 'day' | 'range';

function formatDisplayDate(value: string | null | undefined) {
  if (!value) return '—';

  const timestampValue = value.includes('T') ? value : `${value}T00:00:00`;
  const parsedDate = new Date(timestampValue);

  if (Number.isNaN(parsedDate.getTime())) return value;

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

export default function OwnerAttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<AttendanceFilter>('day');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    void loadAttendance();
  }, []);

  async function loadAttendance() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, user_id, date, check_in, check_out, users(name)')
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      setAttendance((data as unknown as AttendanceRow[]) ?? []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }

  const filteredAttendance = useMemo(() => {
    const normalizedDate = (value: string | null | undefined) => value?.slice(0, 10) ?? '';

    return attendance.filter((row) => {
      const rowDate = normalizedDate(row.date);

      if (filterMode === 'day') {
        return rowDate === selectedDate;
      }

      if (!startDate || !endDate) {
        return true;
      }

      return rowDate >= startDate && rowDate <= endDate;
    });
  }, [attendance, endDate, filterMode, selectedDate, startDate]);

  function calculateHours(checkIn: string | null, checkOut: string | null) {
    if (!checkIn || !checkOut) return '—';

    const start = new Date(checkIn);
    const end = new Date(checkOut);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';

    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">Attendance overview</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Employee attendance records</h2>
          <p className="mt-1 text-sm text-slate-500">Review attendance across the team and filter by day or date range.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1 block">View</span>
            <select
              value={filterMode}
              onChange={(event) => setFilterMode(event.target.value as AttendanceFilter)}
              className="min-w-[140px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="day">Single day</option>
              <option value="range">Date range</option>
            </select>
          </label>

          {filterMode === 'day' ? (
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-1 block">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">Start date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-1 block">End date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading attendance...</p>
      ) : filteredAttendance.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No attendance records found for the selected filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Total Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredAttendance.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.users?.name ?? 'Unknown employee'}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDisplayDate(row.date)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDisplayTime(row.check_in)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDisplayTime(row.check_out)}</td>
                    <td className="px-4 py-3 text-slate-600">{calculateHours(row.check_in, row.check_out)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
