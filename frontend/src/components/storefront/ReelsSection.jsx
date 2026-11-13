import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Play } from 'lucide-react';
import * as reelService from '@/services/reelService';
import SliderArrows, { useSlider } from '@/components/storefront/SliderArrows';
import ReelViewer from '@/components/storefront/ReelViewer';
import SmartImage from '@/components/ui/SmartImage';
import ScrollReveal from '@/components/ui/ScrollReveal';
import InstagramIcon from '@/components/ui/InstagramIcon';
import { useAuthStore } from '@/stores/useAuthStore';
import { isStaff } from '@/lib/roles';
import { isInstagramReel } from '@/lib/instagram';
import { INSTAGRAM_URL } from '@/lib/constants';

// About 1.7 reels on phones, 3 on tablets, 4 on desktop.
const SLIDE = 'snap-start shrink-0 w-[58%] sm:w-[calc((100%_-_1.5rem)/3)] lg:w-[calc((100%_-_3rem)/4)]';

function ReelCard({ reel, onOpen }) {
  const instagram = isInstagramReel(reel);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full aspect-[9/16] overflow-hidden rounded-[var(--radius-card)] bg-neutral-200 text-left cursor-pointer"
      aria-label={`Play video${reel.title ? `: ${reel.title}` : ''}`}
      data-reel-source={instagram ? 'instagram' : 'video'}
    >
      {reel.coverUrl ? (
        <SmartImage
          src={reel.coverUrl}
          alt=""
          draggable={false}
          containerClassName="absolute inset-0"
          className="w-full h-full transition-transform duration-700 group-hover:scale-[1.03]"
        />
      ) : (
        // An Instagram reel added without a cover picture
        <span className="absolute inset-0 bg-[linear-gradient(160deg,#f9ce34_0%,#ee2a7b_45%,#6228d7_100%)]">
          <span className="absolute inset-0 bg-black/25" />
          {reel.title && (
            <span className="absolute inset-x-4 top-14 text-white text-base md:text-lg font-medium leading-snug line-clamp-4">
              {reel.title}
            </span>
          )}
        </span>
      )}
      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      {instagram && (
        <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/35 text-white flex items-center justify-center" title="Instagram reel">
          <InstagramIcon size={16} />
        </span>
      )}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/95 text-black flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110">
        <Play size={20} fill="currentColor" className="ml-0.5" />
      </span>
      {reel.product && (
        <span className="absolute left-3 right-3 bottom-3 truncate bg-white/95 text-black text-xs px-2.5 py-1.5 rounded-md">
          {reel.product.name}
        </span>
      )}
    </button>
  );
}

/** Only shop staff see this, and only while there are no reels: customers see nothing. */
function StaffPlaceholder() {
  return (
    <section className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="rounded-2xl border-2 border-dashed border-neutral-300 p-8 text-center">
          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#d6246e] mb-2">On Instagram · See it in action</p>
          <p className="text-sm text-neutral-700">
            The reels section appears here once a reel is added. Only staff can see this message.
          </p>
          <Link to="/admin/reels" className="inline-block mt-4 px-5 py-2.5 bg-black text-white text-sm rounded-[var(--radius-button)] hover:bg-neutral-800">
            Add reels in the dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

/** "On Instagram - See it in action": the reels added in Admin > Reels. Hidden from customers when there are none. */
export default function ReelsSection() {
  const user = useAuthStore((s) => s.user);
  const [reels, setReels] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const { trackRef, canPrev, canNext, scroll } = useSlider([reels.length]);

  useEffect(() => {
    let cancelled = false;
    reelService.getActive()
      .then((items) => { if (!cancelled) setReels(Array.isArray(items) ? items : []); })
      .catch(() => { if (!cancelled) setReels([]); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  if (reels.length === 0) return loaded && isStaff(user) ? <StaffPlaceholder /> : null;

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <ScrollReveal className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-[#d6246e] mb-2">On Instagram</p>
            <h2 className="text-3xl md:text-[2.75rem] leading-none font-semibold tracking-tight text-black">See it in action</h2>
            <p className="text-sm text-neutral-600 mt-3">Watch our latest reels and shop the products you love.</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {INSTAGRAM_URL && (
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="sf-link">Follow us</a>
            )}
            <SliderArrows canPrev={canPrev} canNext={canNext} onScroll={scroll} label="videos" />
          </div>
        </ScrollReveal>

        <div
          ref={trackRef}
          className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide overscroll-x-contain -mx-4 px-4 lg:mx-0 lg:px-0 scroll-px-4 lg:scroll-px-0 md:cursor-grab"
        >
          {reels.map((reel, i) => (
            <div key={reel.id} className={SLIDE}>
              <ReelCard reel={reel} onOpen={() => setOpenIndex(i)} />
            </div>
          ))}
        </div>
      </div>

      {openIndex !== null && (
        <ReelViewer reels={reels} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </section>
  );
}
