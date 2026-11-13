/**
 * Demo reels, used only when VITE_DATA_PROVIDER=dummy (no backend).
 * On the live site, reels are added in the admin dashboard: Admin > Reels.
 * Demo reels have no video, so they show their cover picture only.
 */
export const reels = [
  {
    id: 'reel-demo-1',
    title: 'Festive silks, ready to drape',
    videoUrl: '',
    coverUrl: '/images/blog/purple-saree-model.jpg',
    productId: null,
    product: null,
    sortOrder: 0,
    isActive: true,
  },
  {
    id: 'reel-demo-2',
    title: 'New arrivals this week',
    videoUrl: '',
    coverUrl: '/images/blog/bridal-group.jpg',
    productId: null,
    product: null,
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'reel-demo-3',
    title: 'Kanchipuram, up close',
    videoUrl: '',
    coverUrl: '/images/blog/silk-closeup.jpg',
    productId: null,
    product: null,
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'reel-demo-4',
    title: 'How we fold a silk saree',
    videoUrl: '',
    coverUrl: '/images/blog/green-silk-care.jpg',
    productId: null,
    product: null,
    sortOrder: 3,
    isActive: true,
  },
  {
    id: 'reel-demo-5',
    title: 'Behind the counter',
    videoUrl: '',
    coverUrl: '/images/blog/festive-display.jpg',
    productId: null,
    product: null,
    sortOrder: 4,
    isActive: true,
  },
];
