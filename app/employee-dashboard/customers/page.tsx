'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type CarOption = {
  id: number;
  name: string;
};

type CustomerFormState = {
  name: string;
  phone: string;
  budget: string;
  carId: string;
  notes: string;
  followUpAt: string;
};

const emptyForm: CustomerFormState = {
  name: '',
  phone: '',
  budget: '',
  carId: '',
  notes: '',
  followUpAt: '',
};

export default function EmployeeCustomersPage() {
  const [form, setForm] = useState<CustomerFormState>(emptyForm);
  const [cars, setCars] = useState<CarOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    void loadPageData();
  }, []);

  async function loadPageData() {
    setLoading(true);
    setError(null);

    try {
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('id, name')
        .order('name', { ascending: true });

      if (carsError) throw carsError;
      setCars((carsData as CarOption[]) ?? []);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      setUserId(authData.user?.id ?? null);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load customer form data.');
    } finally {
      setLoading(false);
    }
  }

  function updateFormField<K extends keyof CustomerFormState>(field: K, value: CustomerFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildCustomerPayload() {
    return {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      budget: form.budget ? Number(form.budget) : null,
      interested_car_id: form.carId || null,
      notes: form.notes.trim() || null,
      status: 'interested',
    };
  }

  function buildFollowupPayload(customerId: number) {
    return {
      customer_id: customerId,
      assigned_to: userId,
      scheduled_time: form.followUpAt ? new Date(form.followUpAt).toISOString() : null,
      status: 'pending',
      notes: form.notes.trim() || null,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!userId) {
        throw new Error('You must be logged in to add a customer.');
      }

      if (!form.name.trim()) {
        throw new Error('Customer name is required.');
      }

      if (!form.followUpAt) {
        throw new Error('A follow-up date/time is required.');
      }

      const customerPayload = buildCustomerPayload();

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert(customerPayload)
        .select('*')
        .single();

      if (customerError) throw customerError;

      const customerId = (customerData as { id: number } | null)?.id;
      if (!customerId) {
        throw new Error('Customer was created, but no ID was returned.');
      }

      const followupPayload = buildFollowupPayload(customerId);

      const { error: followupError } = await supabase
        .from('followups')
        .insert(followupPayload);

      if (followupError) throw followupError;

      setSuccess('Customer and follow-up created successfully.');
      setForm(emptyForm);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        {error ? (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 sm:mb-6">{error}</div>
        ) : null}

        {success ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600 sm:mb-6">{success}</div>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500">Loading form...</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 sm:gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  required
                  value={form.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => updateFormField('phone', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Budget
                <input
                  type="number"
                  value={form.budget}
                  onChange={(e) => updateFormField('budget', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Interested Car
                <select
                  value={form.carId}
                  onChange={(e) => updateFormField('carId', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">Select a car</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Notes
              <textarea
                value={form.notes}
                onChange={(e) => updateFormField('notes', e.target.value)}
                className="mt-1 min-h-28 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Next Follow-up
              <input
                required
                type="datetime-local"
                value={form.followUpAt}
                onChange={(e) => updateFormField('followUpAt', e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Saving...' : 'Add Customer'}
            </button>
          </form>
        )}
      </div>
  );
}