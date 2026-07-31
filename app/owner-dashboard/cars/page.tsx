'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type Car = {
  id: number;
  name: string;
  price: number | null;
  year: number | null;
  fuel: string | null;
  transmission: string | null;
  km_driven: number | null;
  insurance_status: string | null;
  owner_number: string | null;
  status: string | null;
};

type CarFormState = {
  name: string;
  price: string;
  year: string;
  fuel: string;
  transmission: string;
  km_driven: string;
  insurance_status: string;
  owner_number: string;
};

const emptyForm: CarFormState = {
  name: '',
  price: '',
  year: '',
  fuel: '',
  transmission: '',
  km_driven: '',
  insurance_status: '',
  owner_number: '',
};

export default function OwnerDashboardCarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CarFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  async function fetchCars() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('cars')
      .select('*')
      .order('name', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setCars((data as Car[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void fetchCars();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function openCreateForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(car: Car) {
    setForm({
      name: car.name ?? '',
      price: car.price?.toString() ?? '',
      year: car.year?.toString() ?? '',
      fuel: car.fuel ?? '',
      transmission: car.transmission ?? '',
      km_driven: car.km_driven?.toString() ?? '',
      insurance_status: car.insurance_status ?? '',
      owner_number: car.owner_number ?? '',
    });
    setEditingId(car.id);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        price: form.price === '' ? null : Number(form.price),
        year: form.year === '' ? null : Number(form.year),
        fuel: form.fuel.trim() || null,
        transmission: form.transmission.trim() || null,
        km_driven: form.km_driven === '' ? null : Number(form.km_driven),
        insurance_status: form.insurance_status.trim() || null,
        owner_number: form.owner_number.trim() || null,
        ...(editingId ? {} : { status: 'available' }),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('cars')
          .update(payload)
          .eq('id', editingId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('cars').insert(payload);

        if (insertError) throw insertError;
      }

      await fetchCars();
      resetForm();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save car.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this car?')) return;

    const { error: deleteError } = await supabase.from('cars').delete().eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await fetchCars();
  }

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Cars</h1>
        <button onClick={openCreateForm} style={{ padding: '8px 14px', cursor: 'pointer' }}>
          Add Car
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, color: 'crimson', background: '#ffe5e5', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            border: '1px solid #ddd',
            borderRadius: 10,
            padding: 16,
            marginBottom: 24,
            background: '#fafafa',
          }}
        >
          <h2>{editingId ? 'Edit Car' : 'Add New Car'}</h2>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label>
              Name
              <input
                required
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              Price
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              Year
              <input
                type="number"
                name="year"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              Fuel
              <input
                name="fuel"
                value={form.fuel}
                onChange={(e) => setForm({ ...form, fuel: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              Transmission
              <input
                name="transmission"
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              KM Driven
              <input
                type="number"
                name="km_driven"
                value={form.km_driven}
                onChange={(e) => setForm({ ...form, km_driven: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              Insurance Status
              <input
                name="insurance_status"
                value={form.insurance_status}
                onChange={(e) => setForm({ ...form, insurance_status: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              Owner Number
              <input
                name="owner_number"
                value={form.owner_number}
                onChange={(e) => setForm({ ...form, owner_number: e.target.value })}
                style={{ width: '100%', padding: 8, marginTop: 4 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" disabled={submitting} style={{ padding: '8px 14px', cursor: 'pointer' }}>
              {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Car'}
            </button>
            <button type="button" onClick={resetForm} style={{ padding: '8px 14px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading cars...</p>
      ) : cars.length === 0 ? (
        <p>No cars found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {cars.map((car) => (
            <div
              key={car.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 10,
                padding: 16,
                background: '#fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              }}
            >
              <h3 style={{ marginTop: 0 }}>{car.name}</h3>
              <p><strong>Price:</strong> {car.price ?? '—'}</p>
              <p><strong>Year:</strong> {car.year ?? '—'}</p>
              <p><strong>Fuel:</strong> {car.fuel ?? '—'}</p>
              <p><strong>Transmission:</strong> {car.transmission ?? '—'}</p>
              <p><strong>Status:</strong> {car.status ?? '—'}</p>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => openEditForm(car)} style={{ padding: '6px 10px', cursor: 'pointer' }}>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(car.id)}
                  style={{ padding: '6px 10px', cursor: 'pointer', background: '#fcecec', color: '#c00' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}