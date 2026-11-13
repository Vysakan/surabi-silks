import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { embedMarkup, loadInstagramScript, parseInstagramUrl } from '@/lib/instagram';
import { cn } from '@/lib/cn';

// Show the "watch on Instagram" fallback if Instagram's player has not appeared by then
// (for example when a browser's privacy setting blocks it).
const GIVE_UP_MS = 12000;

/**
 * Instagram's own player for one reel or post. To show a different reel, give the
 * component a new key so it starts fresh.
 */
export default function InstagramEmbed({ url, className }) {
  const boxRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const link = parseInstagramUrl(url)?.url || '';

  useEffect(() => {
    const box = boxRef.current;
    if (!box || !link) return undefined;
    let settled = false;
    const finish = (next) => {
      if (settled) return;
      settled = true;
      setStatus(next);
    };

    // React does not manage this box: Instagram's script replaces the placeholder with its player.
    box.innerHTML = embedMarkup(link);
    const observer = new MutationObserver(() => {
      if (box.querySelector('iframe')) finish('ready');
    });
    observer.observe(box, { childList: true, subtree: true });
    const timer = setTimeout(() => finish(box.querySelector('iframe') ? 'ready' : 'failed'), GIVE_UP_MS);

    loadInstagramScript()
      .then((instgrm) => {
        if (!settled) instgrm.Embeds.process();
      })
      .catch(() => finish('failed'));

    return () => {
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      box.innerHTML = '';
    };
  }, [link]);

  const failed = !link || status === 'failed';

  return (
    <div className={cn('w-full', className)} data-instagram-status={failed ? 'failed' : status}>
      <div ref={boxRef} className={cn('w-full', failed && 'hidden')} />
      {failed && (
        <div className="rounded-xl bg-white p-6 text-center">
          <p className="text-sm text-neutral-700">
            {link ? 'The Instagram player could not load here.' : 'This Instagram link is not valid.'}
          </p>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-lg bg-black text-white text-sm hover:bg-neutral-800"
            >
              Watch on Instagram <ExternalLink size={14} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
