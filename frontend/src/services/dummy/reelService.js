import { reels as initialReels } from '@/data/reels';
import { parseInstagramUrl } from '@/lib/instagram';

// Demo mode: reels live in memory only and are lost when the page reloads.
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));
let _reels = JSON.parse(JSON.stringify(initialReels));

const sorted = (list) => [...list].sort((a, b) => a.sortOrder - b.sortOrder || String(b.id).localeCompare(String(a.id)));

export async function getActive() {
  await delay();
  return sorted(_reels.filter((r) => r.isActive));
}

export async function adminList() {
  await delay();
  return { items: sorted(_reels), maxVideoMb: 100, maxImageMb: 5 };
}

export async function create(data) {
  await delay();
  const instagram = parseInstagramUrl(data.videoUrl);
  const reel = {
    id: `reel-${Date.now()}`,
    title: data.title || null,
    source: instagram ? 'instagram' : 'video',
    videoUrl: instagram ? instagram.url : data.videoUrl,
    coverUrl: data.coverUrl || null,
    productId: data.productId ?? null,
    product: data.product ?? null,
    sortOrder: data.sortOrder ?? 0,
    isActive: data.isActive ?? true,
    createdAt: new Date().toISOString(),
  };
  _reels.push(reel);
  return reel;
}

export async function update(id, changes) {
  await delay();
  const index = _reels.findIndex((r) => r.id === id);
  if (index === -1) return null;
  const next = { ..._reels[index], ...changes };
  const instagram = parseInstagramUrl(next.videoUrl);
  next.source = instagram ? 'instagram' : 'video';
  if (instagram) next.videoUrl = instagram.url;
  next.coverUrl = next.coverUrl || null;
  _reels[index] = next;
  return _reels[index];
}

export async function remove(id) {
  await delay();
  _reels = _reels.filter((r) => r.id !== id);
  return true;
}

export async function uploadVideo(file, onProgress) {
  for (let p = 25; p <= 100; p += 25) {
    await delay(120);
    onProgress?.(p);
  }
  return URL.createObjectURL(file);
}

export async function uploadCover(file) {
  await delay();
  return URL.createObjectURL(file);
}
