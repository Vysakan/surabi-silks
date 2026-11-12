import { useRef } from 'react';
import { Link } from 'react-router';
import { reels, instagramUrl } from '@/data/reels';
import SliderArrows, { useSlider } from '@/components/storefront/SliderArrows';
import ScrollReveal from '@/components/ui/ScrollReveal';

const SLIDE = 'snap-start shrink-0 w-[60%] sm:w-[calc((100%_-_2rem)/3)] lg:w-[calc((100%_-_6rem)/5)]';

function Reel({ reel }) {
  const videoRef = useRef(null);
  const play = () => videoRef.current?.play().catch(() => {});
  const pause = () => videoRef.current?.pause();

  return (
    <div className="group" onMouseEnter={play} onMouseLeave={pause}>
      <div className="relative aspect-[9/16] overflow-hidden bg-neutral-200">
        <video
          ref={videoRef}
          src={reel.video}
          poster={reel.poster}
          muted
          loop
          playsInline
          preload="none"
          controls={false}
          onClick={(e) => (e.currentTarget.paused ? play() : pause())}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
        />
      </div>
      {(reel.caption || reel.productSlug) && (
        <div className="pt-3 flex items-start justify-between gap-3">
          {reel.caption && <p className="text-sm text-black line-clamp-2">{reel.caption}</p>}
          {reel.productSlug && (
            <Link to={`/product/${reel.productSlug}`} className="sf-link shrink-0">Shop now</Link>
          )}
        </div>
      )}
    </div>
  );
}

/** "On Instagram - See it in action": short videos from src/data/reels.js. Hidden when there are none. */
export default function ReelsSection() {
  const { trackRef, canPrev, canNext, scroll } = useSlider([reels.length]);
  if (reels.length === 0) return null;

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <ScrollReveal className="flex items-end justify-between gap-4 mb-6">
          <div className="min-w-0">
            <p className="sf-eyebrow mb-2">On Instagram</p>
            <h2 className="sf-heading">See it in action</h2>
            <p className="text-sm text-neutral-600 mt-2">Watch our latest reels and shop the pieces you love.</p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="sf-link">Follow us</a>
            )}
            <SliderArrows canPrev={canPrev} canNext={canNext} onScroll={scroll} label="videos" />
          </div>
        </ScrollReveal>
        <div
          ref={trackRef}
          className="flex gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 scroll-px-4 lg:scroll-px-0"
        >
          {reels.map((reel) => (
            <div key={reel.id} className={SLIDE}><Reel reel={reel} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
