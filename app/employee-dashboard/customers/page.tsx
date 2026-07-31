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
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: 24 }}>
      <h1>Add Customer</h1>

      {error && (
        <div style={{ marginBottom: 16, color: 'crimson', background: '#ffe5e5', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ marginBottom: 16, color: 'green', background: '#e8f8e8', padding: 10, borderRadius: 6 }}>
          {success}
        </div>
      )}

      {loading ? (
        <p>Loading form...</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(e) => updateFormField('name', e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => updateFormField('phone', e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Budget
            <input
              type="number"
              value={form.budget}
              onChange={(e) => updateFormField('budget', e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Interested Car
            <select
              value={form.carId}
              onChange={(e) => updateFormField('carId', e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            >
              <option value="">Select a car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Notes
            <textarea
              value={form.notes}
              onChange={(e) => updateFormField('notes', e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4, minHeight: 100 }}
            />
          </label>

          <label>
            Next Follow-up
            <input
              required
              type="datetime-local"
              value={form.followUpAt}
              onChange={(e) => updateFormField('followUpAt', e.target.value)}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <button type="submit" disabled={submitting} style={{ padding: '10px 16px', cursor: 'pointer' }}>
            {submitting ? 'Saving...' : 'Add Customer'}
          </button>
        </form>
      )}
    </div>
  );
}