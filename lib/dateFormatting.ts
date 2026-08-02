export function formatIstTimestamp(value: string | null | undefined) {
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

export function formatIstDate(value: string | null | undefined) {
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
