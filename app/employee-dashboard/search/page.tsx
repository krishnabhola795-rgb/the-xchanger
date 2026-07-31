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

export default function EmployeeSearchPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [imagesByCarId, setImagesByCarId] = useState<Record<number, string>>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 24 }}>
      <h1>Search Cars</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by car name"
        style={{ width: '100%', padding: 10, marginBottom: 16 }}
      />

      {error && (
        <div style={{ marginBottom: 16, color: 'crimson', background: '#ffe5e5', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading cars...</p>
      ) : filteredCars.length === 0 ? (
        <p>No cars found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {filteredCars.map((car) => {
            const imageUrl = imagesByCarId[car.id];

            return (
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
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={car.name}
                    style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                  />
                ) : null}

                <h3 style={{ marginTop: 0 }}>{car.name}</h3>
                <p><strong>Price:</strong> {car.price ?? '—'}</p>
                <p><strong>Year:</strong> {car.year ?? '—'}</p>
                <p><strong>Fuel:</strong> {car.fuel ?? '—'}</p>
                <p><strong>Transmission:</strong> {car.transmission ?? '—'}</p>
                <p><strong>Insurance Status:</strong> {car.insurance_status ?? '—'}</p>
                <p><strong>Status:</strong> {car.status ?? '—'}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}