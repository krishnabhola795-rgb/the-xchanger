'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type CarOption = {
  id: number;
  name: string;
};

type ColumnMeta = {
  column_name: string;
  is_nullable: string;
  column_default: string | null;
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
  const [customerColumns, setCustomerColumns] = useState<ColumnMeta[]>([]);
  const [followupColumns, setFollowupColumns] = useState<ColumnMeta[]>([]);

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

      const [customerCols, followupCols] = await Promise.all([
        getTableColumns('customers'),
        getTableColumns('followups'),
      ]);

      setCustomerColumns(customerCols);
      setFollowupColumns(followupCols);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load customer form data.');
    } finally {
      setLoading(false);
    }
  }

  async function getTableColumns(tableName: string): Promise<ColumnMeta[]> {
    try {
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);

      if (error) {
        console.warn(`Unable to inspect schema for ${tableName}:`, error);
        return [];
      }

      return (data as ColumnMeta[]) ?? [];
    } catch (err) {
      console.warn(`Unable to inspect schema for ${tableName}:`, err);
      return [];
    }
  }

  function findColumn(columns: ColumnMeta[], candidates: string[]) {
    return candidates.find((candidate) =>
      columns.some((col) => col.column_name.toLowerCase() === candidate.toLowerCase())
    );
  }

  function buildCustomerPayload() {
    const payload: Record<string, unknown> = {};

    const nameCol = findColumn(customerColumns, ['name']);
    if (nameCol) payload[nameCol] = form.name.trim();

    const phoneCol = findColumn(customerColumns, ['phone', 'phone_number']);
    if (phoneCol) payload[phoneCol] = form.phone.trim() || null;

    const budgetCol = findColumn(customerColumns, ['budget']);
    if (budgetCol) payload[budgetCol] = form.budget ? Number(form.budget) : null;

    const carCol = findColumn(customerColumns, ['car_id', 'interested_car_id', 'car']);
    if (carCol) {
      payload[carCol] = form.carId ? Number(form.carId) : null;
    }

    const notesCol = findColumn(customerColumns, ['notes']);
    if (notesCol) payload[notesCol] = form.notes.trim() || null;

    const followUpCol = findColumn(customerColumns, [
      'next_follow_up',
      'follow_up_at',
      'follow_up_date',
      'scheduled_at',
    ]);
    if (followUpCol) {
      payload[followUpCol] = form.followUpAt ? new Date(form.followUpAt).toISOString() : null;
    }

    return payload;
  }

  function buildFollowupPayload(customerId: number) {
    const payload: Record<string, unknown> = {};

    const customerCol = findColumn(followupColumns, ['customer_id', 'customer']);
    if (customerCol) payload[customerCol] = customerId;

    const assignedCol = findColumn(followupColumns, ['assigned_to', 'employee_id']);
    if (assignedCol) payload[assignedCol] = userId;

    const notesCol = findColumn(followupColumns, ['notes', 'comment']);
    if (notesCol) payload[notesCol] = form.notes.trim() || null;

    const scheduledCol = findColumn(followupColumns, [
      'scheduled_time',
      'scheduled_at',
      'next_follow_up',
      'follow_up_at',
      'follow_up_date',
    ]);
    if (scheduledCol) {
      payload[scheduledCol] = form.followUpAt ? new Date(form.followUpAt).toISOString() : null;
    }

    return payload;
  }

  function applySensibleDefaults(tableName: string, payload: Record<string, unknown>, columns: ColumnMeta[]) {
    const requiredColumns = columns.filter((col) => {
      const name = col.column_name.toLowerCase();
      if (name === 'id') return false;
      if (name.endsWith('_id') && col.column_default && col.column_default.includes('nextval')) return false;
      return col.is_nullable === 'NO' && !col.column_default;
    });

    for (const col of requiredColumns) {
      const value = payload[col.column_name];

      if (value === undefined || value === null || value === '') {
        if (tableName === 'customers' && col.column_name.toLowerCase() === 'status') {
          payload[col.column_name] = 'new';
        } else if (tableName === 'followups' && col.column_name.toLowerCase() === 'status') {
          payload[col.column_name] = 'pending';
        }
      }
    }
  }

  function validateRequiredColumns(tableName: string, payload: Record<string, unknown>, columns: ColumnMeta[]) {
    const requiredColumns = columns.filter((col) => {
      const name = col.column_name.toLowerCase();
      if (name === 'id') return false;
      if (name.endsWith('_id') && col.column_default && col.column_default.includes('nextval')) return false;
      return col.is_nullable === 'NO' && !col.column_default;
    });

    for (const col of requiredColumns) {
      const value = payload[col.column_name];

      if (value === undefined || value === null || value === '') {
        throw new Error(`The ${tableName} table requires "${col.column_name}" and it was not provided.`);
      }
    }
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
      applySensibleDefaults('customers', customerPayload, customerColumns);
      validateRequiredColumns('customers', customerPayload, customerColumns);

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
      applySensibleDefaults('followups', followupPayload, followupColumns);
      validateRequiredColumns('followups', followupPayload, followupColumns);

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
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Budget
            <input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              style={{ width: '100%', padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Interested Car
            <select
              value={form.carId}
              onChange={(e) => setForm({ ...form, carId: e.target.value })}
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
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ width: '100%', padding: 8, marginTop: 4, minHeight: 100 }}
            />
          </label>

          <label>
            Next Follow-up
            <input
              required
              type="datetime-local"
              value={form.followUpAt}
              onChange={(e) => setForm({ ...form, followUpAt: e.target.value })}
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