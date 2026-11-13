import { apiClient } from './client.js';

/** Reels shown on the website (switched on), in display order. */
export async function getActive() {
  const { data } = await apiClient.get('/reels');
  return data;
}

/** Admin: every reel, plus the upload limits { items, maxVideoMb, maxImageMb }. */
export async function adminList() {
  const { data } = await apiClient.get('/admin/reels');
  return data;
}

export async function create(reel) {
  const { data } = await apiClient.post('/reels', reel);
  return data;
}

export async function update(id, changes) {
  const { data } = await apiClient.put(`/reels/${id}`, changes);
  return data;
}

export async function remove(id) {
  await apiClient.delete(`/reels/${id}`);
  return true;
}

/** Uploads a video file and returns its URL. onProgress receives 0-100. */
export async function uploadVideo(file, onProgress) {
  const formData = new FormData();
  formData.append('video', file);
  const { data } = await apiClient.post('/reels/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 0,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data.url;
}

/** Uploads a cover picture and returns its URL. */
export async function uploadCover(file) {
  const formData = new FormData();
  formData.append('image', file);
  const { data } = await apiClient.post('/reels/covers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
}
