const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function submitEnquiry(data) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to submit enquiry');
  return res.json();
}
