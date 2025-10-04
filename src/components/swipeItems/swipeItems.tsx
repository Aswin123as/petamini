import { useState, useEffect, useMemo, ReactNode, KeyboardEvent } from 'react';

interface SwipeableGridProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string | number;
  itemsPerPage?: number;
  columns?: number;
  gap?: number;
  showIndicators?: boolean;
  showArrows?: boolean;
  loop?: boolean;
}

function SwipeableGrid<T>({
  items,
  renderItem,
  keyExtractor,
  itemsPerPage = 6,
  columns = 3,
  gap = 2,
  showIndicators = true,
  showArrows = true,
  loop = false,
}: SwipeableGridProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [showArrowHint, setShowArrowHint] = useState(true);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const minSwipeDistance = 50;

  // Hide arrow hint after 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowArrowHint(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const colClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
    }[columns] || 'grid-cols-3';

  const gapClass =
    {
      0: 'gap-0',
      1: 'gap-1',
      2: 'gap-2',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8',
    }[gap] || 'gap-2';

  const currentItems = useMemo(
    () =>
      items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage),
    [items, currentPage, itemsPerPage]
  );

  const goToPage = (page: number) => {
    if (loop) setCurrentPage((page + totalPages) % totalPages);
    else setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null || touchStartY === null)
      return;
    const deltaX = touchStart - touchEnd;
    const deltaY = Math.abs(touchStartY - (touchEnd || 0));
    if (Math.abs(deltaX) < Math.abs(deltaY)) return;
    if (deltaX > minSwipeDistance) nextPage();
    if (deltaX < -minSwipeDistance) prevPage();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') nextPage();
    if (e.key === 'ArrowLeft') prevPage();
  };

  return (
    <div className="relative outline-none" tabIndex={0} onKeyDown={onKeyDown}>
      {/* Grid container */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md shadow-xl p-4"
      >
        <div className={`grid ${colClass} ${gapClass}`}>
          {currentItems.map((item) => (
            <div key={keyExtractor(item)}>{renderItem(item)}</div>
          ))}
        </div>
      </div>

      {/* Temporary arrow hint for mobile */}
      {showArrowHint && (
        <div className="absolute inset-0 flex justify-between items-center px-2 pointer-events-none md:hidden">
          <div className="text-white/50 text-lg select-none">← Swipe</div>
          <div className="text-white/50 text-lg select-none">Swipe →</div>
        </div>
      )}

      {/* Arrow Navigation (desktop only) */}
      {showArrows && totalPages > 1 && (
        <>
          {(loop || currentPage > 0) && (
            <button
              onClick={prevPage}
              aria-label="Previous page"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 
                p-3 rounded-full text-white text-2xl z-10"
            >
              ←
            </button>
          )}
          {(loop || currentPage < totalPages - 1) && (
            <button
              onClick={nextPage}
              aria-label="Next page"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 
                p-3 rounded-full text-white text-2xl z-10"
            >
              →
            </button>
          )}
        </>
      )}

      {/* Page Indicators */}
      {showIndicators && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              aria-label={`Go to page ${idx + 1}`}
              className={`h-2 rounded-full transition-all backdrop-blur-md bg-white/30 ${
                idx === currentPage ? 'w-6 bg-white/70' : 'w-2'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SwipeableGrid;
