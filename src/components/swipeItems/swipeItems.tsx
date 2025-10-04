import {
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SWIPE_HINT_DURATION = 2500;
const MIN_SWIPE_THRESHOLD = 0.15;
const ANIMATION_DURATION = 400;
const VELOCITY_THRESHOLD = 0.6;

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
  onPageChange?: (page: number) => void;
}

function SwipeableGrid<T>({
  items = [],
  renderItem,
  keyExtractor,
  itemsPerPage = 6,
  columns = 3,
  gap = 2,
  showIndicators = true,
  showArrows = true,
  loop = false,
  onPageChange,
}: SwipeableGridProps<T>): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);
  const [showArrowHint, setShowArrowHint] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchState = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    isDragging: false,
  });

  const reducedMotion = useRef(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const totalPages = Math.max(
    1,
    Math.ceil((items?.length || 0) / itemsPerPage)
  );

  useEffect(() => {
    const timer = setTimeout(
      () => setShowArrowHint(false),
      SWIPE_HINT_DURATION
    );
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

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

  const getPageItems = (pageIndex: number) => {
    if (
      !items ||
      items.length === 0 ||
      pageIndex < 0 ||
      pageIndex >= totalPages
    ) {
      return [];
    }
    return items.slice(
      pageIndex * itemsPerPage,
      (pageIndex + 1) * itemsPerPage
    );
  };

  const pages = useMemo(() => {
    const prevIndex = loop
      ? (currentPage - 1 + totalPages) % totalPages
      : currentPage - 1;
    const nextIndex = loop ? (currentPage + 1) % totalPages : currentPage + 1;

    return {
      prev: getPageItems(prevIndex),
      current: getPageItems(currentPage),
      next: getPageItems(nextIndex),
    };
  }, [items, currentPage, itemsPerPage, totalPages, loop]);

  const applyRubberBand = (distance: number, dimension: number): number => {
    const constant = 0.55;
    const absDistance = Math.abs(distance);
    const result =
      (1.0 - 1.0 / ((absDistance * constant) / dimension + 1.0)) * dimension;
    return distance < 0 ? -result : result;
  };

  const goToPage = (page: number): void => {
    if (totalPages <= 1 || isAnimating) return;

    const newPage = loop
      ? ((page % totalPages) + totalPages) % totalPages
      : Math.max(0, Math.min(page, totalPages - 1));

    if (newPage === currentPage) return;

    setIsAnimating(true);
    setCurrentPage(newPage);

    setTimeout(() => {
      setIsAnimating(false);
    }, ANIMATION_DURATION);
  };

  const nextPage = (): void => {
    if (!loop && currentPage >= totalPages - 1) return;
    goToPage(currentPage + 1);
  };

  const prevPage = (): void => {
    if (!loop && currentPage <= 0) return;
    goToPage(currentPage - 1);
  };

  // Swipe events
  useEffect(() => {
    const container = containerRef.current;
    if (!container || totalPages <= 1) return;

    const handleTouchStart = (e: TouchEvent): void => {
      if (isAnimating) return;

      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastTime: Date.now(),
        isDragging: false,
      };
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (isAnimating) return;

      const touch = e.touches[0];
      const dx = touch.clientX - touchState.current.startX;
      const dy = touch.clientY - touchState.current.startY;

      if (
        !touchState.current.isDragging &&
        Math.abs(dx) > Math.abs(dy) &&
        Math.abs(dx) > 10
      ) {
        touchState.current.isDragging = true;
        setIsDragging(true);
      }

      if (!touchState.current.isDragging) return;

      e.preventDefault();

      const containerWidth = container.offsetWidth;
      let offsetX = dx;

      if (!loop) {
        if (currentPage === 0 && dx > 0) {
          offsetX = applyRubberBand(dx, containerWidth);
        } else if (currentPage === totalPages - 1 && dx < 0) {
          offsetX = applyRubberBand(dx, containerWidth);
        }
      }

      setDragOffset(offsetX);
      touchState.current.lastX = touch.clientX;
      touchState.current.lastTime = Date.now();
    };

    const handleTouchEnd = (): void => {
      if (!touchState.current.isDragging || isAnimating) return;

      const containerWidth = container.offsetWidth;
      const threshold = containerWidth * MIN_SWIPE_THRESHOLD;

      const distance = touchState.current.lastX - touchState.current.startX;
      const timeDelta = Date.now() - touchState.current.lastTime;
      const velocity = timeDelta > 0 ? Math.abs(distance) / timeDelta : 0;

      const currentOffset = dragOffset;

      setIsDragging(false);
      setDragOffset(0);
      touchState.current.isDragging = false;

      const shouldChangePage =
        Math.abs(currentOffset) > threshold || velocity > VELOCITY_THRESHOLD;

      if (shouldChangePage) {
        if (currentOffset > 0 && (loop || currentPage > 0)) {
          prevPage();
        } else if (
          currentOffset < 0 &&
          (loop || currentPage < totalPages - 1)
        ) {
          nextPage();
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    container.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [currentPage, totalPages, loop, isAnimating, dragOffset]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowRight') nextPage();
    else if (e.key === 'ArrowLeft') prevPage();
    else if (e.key === 'Home') goToPage(0);
    else if (e.key === 'End') goToPage(totalPages - 1);
  };

  const canGoPrev = loop || currentPage > 0;
  const canGoNext = loop || currentPage < totalPages - 1;

  return (
    <div
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 rounded-2xl"
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="region"
      aria-label="Swipeable grid"
      aria-roledescription="carousel"
    >
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.15)] border border-white/20 p-4 md:p-6 select-none"
      >
        <div
          className={`flex ${
            !isDragging && !reducedMotion.current
              ? 'transition-transform duration-[400ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]'
              : ''
          }`}
          style={{
            transform: `translateX(calc(-100% + ${dragOffset}px))`,
            willChange: isDragging ? 'transform' : 'auto',
          }}
        >
          <div className="flex-shrink-0 w-full" aria-hidden={!canGoPrev}>
            <div className={`grid ${colClass} ${gapClass}`}>
              {pages.prev.length > 0 ? (
                pages.prev.map((item) => (
                  <div key={`prev-${keyExtractor(item)}`} className="min-w-0">
                    {renderItem(item)}
                  </div>
                ))
              ) : (
                <div className="col-span-full h-1"></div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 w-full">
            <div className={`grid ${colClass} ${gapClass}`}>
              {pages.current.length > 0 ? (
                pages.current.map((item) => (
                  <div key={keyExtractor(item)} className="min-w-0">
                    {renderItem(item)}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center text-white/60 py-10">
                  <span className="text-5xl mb-2">🫧</span>
                  <p>No items to display</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 w-full" aria-hidden={!canGoNext}>
            <div className={`grid ${colClass} ${gapClass}`}>
              {pages.next.length > 0 ? (
                pages.next.map((item) => (
                  <div key={`next-${keyExtractor(item)}`} className="min-w-0">
                    {renderItem(item)}
                  </div>
                ))
              ) : (
                <div className="col-span-full h-1"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showArrowHint && totalPages > 1 && (
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none md:hidden">
          <div className="animate-pulse text-white/50 text-sm font-medium select-none">
            ←
          </div>
          <div className="animate-pulse text-white/50 text-sm font-medium select-none">
            →
          </div>
        </div>
      )}

      {showArrows && totalPages > 1 && (
        <>
          <button
            onClick={prevPage}
            disabled={!canGoPrev}
            aria-label="Previous page"
            className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 
              p-4 rounded-full bg-white/15 backdrop-blur-md opacity-80
              hover:opacity-100 active:scale-95 transition-all duration-300 z-10
              disabled:opacity-0 disabled:pointer-events-none`}
          >
            <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>

          <button
            onClick={nextPage}
            disabled={!canGoNext}
            aria-label="Next page"
            className={`hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 
              p-4 rounded-full bg-white/15 backdrop-blur-md opacity-80
              hover:opacity-100 active:scale-95 transition-all duration-300 z-10
              disabled:opacity-0 disabled:pointer-events-none`}
          >
            <ChevronRight className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </>
      )}

      {showIndicators && totalPages > 1 && (
        <div
          className="flex justify-center gap-2 mt-6"
          role="tablist"
          aria-label="Pages"
        >
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              disabled={isAnimating}
              aria-label={`Go to page ${idx + 1}`}
              aria-current={idx === currentPage ? 'true' : 'false'}
              role="tab"
              className={`h-2 rounded-full transition-all duration-300 
                ${
                  idx === currentPage
                    ? 'w-8 bg-white opacity-100 scale-110'
                    : 'w-2 bg-white/40 opacity-60 hover:opacity-80 scale-90'
                } 
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SwipeableGrid;
