export function formatIstTimestamp(value: string | null | undefined) {
  if (!value) return '—';

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatIstDate(value: string | null | undefined) {
  if (!value) return '—';

  const parsedDate = value.includes('T') ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
