'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

type Car = {
  id: number;
  name: string;
  price: number | null;
  year: number | null;
  fuel: string | null;
  transmission: string | null;
  insurance_status: string | null;
  status: string | null;
};

type CarImageRow = {
  car_id?: number | null;
  image_url?: string | null;
  url?: string | null;
  path?: string | null;
};

type CustomerFormState = {
  name: string;
  phone: string;
  budget: number | null;
  carId: number | null;
  notes: string;
  followUpAt: string | null;
};

export default function EmployeeSearchPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [imagesByCarId, setImagesByCarId] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerFormState>({
    name: '',
    phone: '',
    budget: null,
    carId: null,
    notes: '',
    followUpAt: null,
  });

  async function loadCars() {
    setLoading(true);
    setError(null);

    try {
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('id, name, price, year, fuel, transmission, insurance_status, status')
        .order('name', { ascending: true });

      if (carsError) {
        throw carsError;
      }

      const normalizedCars = (carsData as Car[]) ?? [];

      const carIds = normalizedCars.map((car) => car.id);

      const imageMap: Record<number, string> = {};

      if (carIds.length > 0) {
        const { data: imageRows, error: imageError } = await supabase
          .from('car_images')
          .select('*')
          .in('car_id', carIds);

        if (!imageError) {
          (imageRows as CarImageRow[] | null)?.forEach((row) => {
            const carId = row?.car_id;
            const imageUrl = row?.image_url ?? row?.url ?? row?.path ?? null;

            if (carId && imageUrl && !imageMap[carId]) {
              imageMap[carId] = imageUrl;
            }
          });
        } else {
          console.warn('Unable to load car images:', imageError);
        }
      }

      setCars(normalizedCars);
      setImagesByCarId(imageMap);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load cars.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCars();
  }, []);

  const filteredCars = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return cars;

    return cars.filter((car) => car.name.toLowerCase().includes(term));
  }, [cars, search]);

  function updateFormField<K extends keyof CustomerFormState>(field: K, value: CustomerFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-indigo-600">Vehicle search</p>
            <h1 className="mt-1 text-xl font-semibold text-slate-900">Search Cars</h1>
            <p className="mt-1 text-sm text-slate-500">Browse available inventory with a clean, responsive view.</p>
          </div>

          <label className="relative block w-full max-w-md">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Zm0 0 6.5 6.5" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by car name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </label>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading cars...</p>
      ) : filteredCars.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No cars found.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCars.map((car) => {
            const imageUrl = imagesByCarId[car.id];

            return (
              <div
                key={car.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={car.name}
                    className="mb-4 h-44 w-full rounded-xl object-cover"
                  />
                ) : null}

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

                <div className="mt-4 space-y-1 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Insurance:</span> {car.insurance_status ?? '—'}</p>
                  <p><span className="font-medium text-slate-900">Status:</span> {car.status ?? '—'}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildCustomerPayload() {
  return {
    name: '',
    phone: null,
    budget: null,
    interested_car_id: null,
    notes: null,
    status: 'interested',
  };
}

async function createCustomer(customerPayload: Record<string, unknown>) {
  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .insert(customerPayload)
    .select('*')
    .single();

  if (customerError) {
    console.warn('Failed to create customer:', customerError);
  } else {
    console.log('Customer created:', customerData);
  }
}