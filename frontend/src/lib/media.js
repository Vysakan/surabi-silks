// Uploaded files are stored by the API. When the API is on another address (for example
// https://surabhiwebapi.semicoloninnovations.in/api/v1), a stored "/uploads/x.jpg" must be
// loaded from the API's address, not the website's.
const API_BASE = import.meta.env.VITE_API_BASE || '';

let apiOrigin = '';
try {
  if (/^https?:\/\//i.test(API_BASE)) apiOrigin = new URL(API_BASE).origin;
} catch {
  apiOrigin = '';
}

/** Full address for an image or video URL from the API. Other URLs are returned unchanged. */
export function mediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (apiOrigin && url.startsWith('/uploads/')) return apiOrigin + url;
  return url;
}
