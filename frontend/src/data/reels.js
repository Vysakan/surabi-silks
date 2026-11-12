/**
 * "See it in action" videos on the home page (like Instagram reels).
 * The section stays hidden while this list is empty.
 *
 * To add one:
 *   1. Put a short vertical video (MP4, 9:16, ideally under 5 MB) in public/videos/
 *      and a still image of it in public/images/reels/.
 *   2. Add an entry below. `productSlug` is optional: it adds a "Shop now" link
 *      to that product (the part after /product/ in its address).
 *
 * Example:
 *   {
 *     id: 'reel-1',
 *     video: '/videos/kanchipuram-drape.mp4',
 *     poster: '/images/reels/kanchipuram-drape.jpg',
 *     caption: 'Kanchipuram silk, draped',
 *     productSlug: 'kanchipuram-silk-saree-peacock-motif',
 *   },
 */
export const reels = [];

// Your Instagram page; shown as "Follow us" next to the videos. Leave '' to hide.
export const instagramUrl = '';
