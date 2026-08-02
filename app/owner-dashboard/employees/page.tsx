'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type EmployeeProfile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

export default function OwnerEmployeesPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEmployee, setCreatedEmployee] = useState<{ email: string; temporaryPassword: string } | null>(null);

  useEffect(() => {
    void loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.from('users').select('id, name, email, role').eq('role', 'employee').order('name', { ascending: true });
      if (fetchError) throw fetchError;
      setEmployees((data as EmployeeProfile[]) ?? []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEmployee(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setCreatedEmployee(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error('You must be signed in to create employees.');
      }

      const response = await fetch('/api/owner/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create employee.');
      }

      setCreatedEmployee(result.employee);
      setName('');
      setEmail('');
      setPassword('');
      await loadEmployees();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create employee.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Employees</h2>
        <p className="text-sm text-slate-500">Create employee accounts and share their temporary login details.</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      ) : null}

      {createdEmployee ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-semibold">Employee created successfully</p>
          <p className="mt-1">Email: {createdEmployee.email}</p>
          <p className="mt-1">Temporary password: {createdEmployee.temporaryPassword}</p>
        </div>
      ) : null}

      <form onSubmit={handleCreateEmployee} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Employee name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Employee email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700">
          Temporary password (optional)
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to auto-generate"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Creating...' : 'Create employee'}
        </button>
      </form>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Existing employees</h3>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No employee accounts created yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {employees.map((employee) => (
              <div key={employee.id} className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{employee.name ?? 'Unnamed employee'}</p>
                <p className="mt-1">{employee.email ?? 'No email on file'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
