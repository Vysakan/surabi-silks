import { useState } from 'react';
import { cn } from '@/lib/cn';

export default function ImageGallery({ images = [], alt = '' }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) {
    return (
      <div className="aspect-[3/4] bg-neutral-100 rounded-[var(--radius-card)] flex items-center justify-center text-neutral-400">
        No image
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-3">
      <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px]">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={cn(
              'w-16 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-colors',
              i === activeIndex ? 'border-primary-400' : 'border-transparent hover:border-neutral-300'
            )}
          >
            <img src={img} alt={`${alt} ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <div className="flex-1 relative group">
        <div className="aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden bg-neutral-100">
          <img
            src={images[activeIndex]}
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>
    </div>
  );
}
