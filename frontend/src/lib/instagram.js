// Instagram reel and post links. Reels added in Admin > Reels can be an uploaded video
// or an Instagram link; Instagram links are shown with Instagram's own player.

const LINK = /^https?:\/\/(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/(?:[A-Za-z0-9._]+\/)?(reels?|p|tv)\/([A-Za-z0-9_-]{5,64})\/?(?:[?#].*)?$/i;
const HOST = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*(?:instagram\.com|instagr\.am)(?:[/?#]|$)/i;

/**
 * Reads a link from Instagram's Share > Copy link, for example
 * https://www.instagram.com/reel/C9abc123XYZ/?igsh=... or instagram.com/shop/reel/C9abc123XYZ.
 * Returns { kind, code, url } with url in its standard form, or null when it is not a reel or post link.
 */
export function parseInstagramUrl(value) {
  let text = typeof value === 'string' ? value.trim() : '';
  if (!text) return null;
  if (!/^https?:\/\//i.test(text) && HOST.test(text)) text = `https://${text}`;
  const match = LINK.exec(text);
  if (!match) return null;
  const kind = match[1].toLowerCase() === 'reels' ? 'reel' : match[1].toLowerCase();
  const code = match[2];
  return { kind, code, url: `https://www.instagram.com/${kind}/${code}/` };
}

/** True for any instagram.com address (a profile, a story, a reel...). */
export function isInstagramAddress(value) {
  return typeof value === 'string' && HOST.test(value.trim());
}

/** True when the reel is an Instagram link rather than an uploaded video. */
export function isInstagramReel(reel) {
  if (!reel) return false;
  if (reel.source) return reel.source === 'instagram';
  return parseInstagramUrl(reel.videoUrl) !== null;
}

/** The markup Instagram's embed script turns into its player. Built only from a parsed link. */
export function embedMarkup(link) {
  const parsed = parseInstagramUrl(link);
  if (!parsed) return '';
  const href = parsed.url;
  return (
    `<blockquote class="instagram-media" data-instgrm-permalink="${href}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14"`
    + ' style="background:#fff;border:0;border-radius:12px;margin:0 auto;max-width:540px;min-width:280px;padding:0;width:100%;">'
    + `<a href="${href}" target="_blank" rel="noopener noreferrer" style="display:block;padding:48px 16px;font:14px/1.4 system-ui,sans-serif;color:#737373;text-align:center;text-decoration:none;">Loading the reel&hellip;<br><span style="color:#262626;text-decoration:underline;">Open it on Instagram</span></a>`
    + '</blockquote>'
  );
}

const SCRIPT_URL = 'https://www.instagram.com/embed.js';
let scriptPromise = null;

/** Loads Instagram's embed script once. Resolves with window.instgrm. */
export function loadInstagramScript() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No browser'));
  if (window.instgrm?.Embeds) return Promise.resolve(window.instgrm);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        if (window.instgrm?.Embeds) resolve(window.instgrm);
        else {
          scriptPromise = null;
          reject(new Error('Instagram player unavailable'));
        }
      };
      script.onerror = () => {
        scriptPromise = null; // a later reel can try again
        script.remove();
        reject(new Error('Instagram player blocked'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}
