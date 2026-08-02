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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCars = cars.filter((car) => {
    const query = searchTerm.toLowerCase();
    return (
      car.name.toLowerCase().includes(query) ||
      (car.fuel ?? '').toLowerCase().includes(query) ||
      (car.transmission ?? '').toLowerCase().includes(query) ||
      (car.status ?? '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">Inventory</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Vehicle catalog</h2>
            <p className="mt-1 text-sm text-slate-500">Add, edit, and keep your inventory easy to browse.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block min-w-[240px] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 0 6.5 6.5" />
                </svg>
              </span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cars"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </label>
            <button
              onClick={openCreateForm}
              className="min-h-[44px] rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Add Car
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
      ) : null}

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Car' : 'Add New Car'}</h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Name
                <input
                  required
                  name="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Price
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Year
                <input
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Fuel
                <input
                  name="fuel"
                  value={form.fuel}
                  onChange={(e) => setForm({ ...form, fuel: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Transmission
                <input
                  name="transmission"
                  value={form.transmission}
                  onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                KM Driven
                <input
                  type="number"
                  name="km_driven"
                  value={form.km_driven}
                  onChange={(e) => setForm({ ...form, km_driven: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Insurance Status
                <input
                  name="insurance_status"
                  value={form.insurance_status}
                  onChange={(e) => setForm({ ...form, insurance_status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Owner Number
                <input
                  name="owner_number"
                  value={form.owner_number}
                  onChange={(e) => setForm({ ...form, owner_number: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={submitting} className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70">
                {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Create Car'}
              </button>
              <button type="button" onClick={resetForm} className="min-h-[44px] rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Cancel
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-slate-500">Loading cars...</p>
        ) : filteredCars.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
            {searchTerm ? 'No cars match your search yet.' : 'No cars found.'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCars.map((car) => (
              <div key={car.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{car.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{car.status ?? 'Available'}</p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                    {car.transmission ?? '—'}
                  </span>
                </div>

                <p className="mt-4 text-2xl font-bold text-indigo-700">
                  {car.price != null ? `₹${car.price.toLocaleString()}` : 'Price on request'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    Year {car.year ?? '—'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {car.fuel ?? 'Fuel —'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {car.transmission ?? 'Transmission —'}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <button onClick={() => openEditForm(car)} className="min-h-[44px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(car.id)}
                    className="min-h-[44px] flex-1 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100"
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