import axios from 'axios';

const API = import.meta.env.VITE_API_BASE || '/api';

export async function getByProductId(productId) {
  const { data } = await axios.get(`${API}/products/${productId}/reviews`);
  return data;
}

export async function create(reviewData) {
  const { data } = await axios.post(`${API}/reviews`, reviewData);
  return data;
}
