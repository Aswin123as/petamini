import {
  useState,
  useEffect,
  useMemo,
  useRef,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Constants
const SWIPE_HINT_DURATION = 2000;
const MIN_SWIPE_THRESHOLD = 0.25; // 25% of container width
const ANIMATION_DURATION = 300; // ms

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
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const totalPages = Math.max(
    1,
    Math.ceil((items?.length || 0) / itemsPerPage)
  );

  // Hide swipe hint after duration
  useEffect(() => {
    const timer = setTimeout(
      () => setShowArrowHint(false),
      SWIPE_HINT_DURATION
    );
    return () => clearTimeout(timer);
  }, []);

  // Notify parent of page changes
  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Column class mapping (Tailwind-safe)
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

  const currentItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
    );
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (page: number): void => {
    if (totalPages <= 1 || isAnimating) return;

    setIsAnimating(true);

    const newPage = loop
      ? ((page % totalPages) + totalPages) % totalPages
      : Math.max(0, Math.min(page, totalPages - 1));

    setCurrentPage(newPage);

    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION);
  };

  const nextPage = (): void => goToPage(currentPage + 1);
  const prevPage = (): void => goToPage(currentPage - 1);

  // Set up touch event listeners with { passive: false }
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent): void => {
      if (totalPages <= 1) return;

      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent): void => {
      if (startXRef.current === null || startYRef.current === null) return;

      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = touch.clientY - startYRef.current;

      // Prevent horizontal swipe if user is scrolling vertically
      if (Math.abs(dy) > Math.abs(dx)) {
        return;
      }

      // Mark as dragging and prevent default scroll
      if (!isDraggingRef.current) {
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      // Prevent page scroll while swiping horizontally
      e.preventDefault();

      // Apply rubber band effect at boundaries
      let dampedOffset = dx;
      if (!loop) {
        if (currentPage === 0 && dx > 0) {
          dampedOffset = dx * 0.3; // Dampen when at start
        } else if (currentPage === totalPages - 1 && dx < 0) {
          dampedOffset = dx * 0.3; // Dampen when at end
        }
      }

      setOffsetX(dampedOffset);
    };

    const handleTouchEnd = (): void => {
      if (startXRef.current === null) return;

      const containerWidth = container?.offsetWidth || 300;
      const threshold = containerWidth * MIN_SWIPE_THRESHOLD;

      setIsDragging(false);
      isDraggingRef.current = false;

      // Determine if swipe was significant enough
      if (offsetX > threshold) {
        prevPage(); // Swiped right -> previous page
      } else if (offsetX < -threshold) {
        nextPage(); // Swiped left -> next page
      }

      // Reset
      setOffsetX(0);
      startXRef.current = null;
      startYRef.current = null;
    };

    // Add listeners with { passive: false } to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    container.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [totalPages, currentPage, loop, offsetX]);

  // Keyboard navigation
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevPage();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToPage(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToPage(totalPages - 1);
    }
  };

  const canGoPrev = loop || currentPage > 0;
  const canGoNext = loop || currentPage < totalPages - 1;

  return (
    <div
      className="relative outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-2xl"
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="region"
      aria-label="Swipeable grid"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Grid container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md shadow-xl p-4 select-none"
      >
        <div
          className={`grid ${colClass} ${gapClass} transition-transform duration-300 ease-out`}
          style={{
            transform: isDragging
              ? `translateX(${offsetX}px)`
              : 'translateX(0)',
          }}
        >
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <div key={keyExtractor(item)} className="min-w-0">
                {renderItem(item)}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-white/50 py-8">
              No items to display
            </div>
          )}
        </div>
      </div>

      {/* Mobile swipe hint */}
      {showArrowHint && totalPages > 1 && (
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none md:hidden animate-pulse">
          <div className="text-white/60 text-sm font-medium select-none">
            ← Swipe
          </div>
          <div className="text-white/60 text-sm font-medium select-none">
            Swipe →
          </div>
        </div>
      )}

      {/* Arrow Navigation (desktop) */}
      {showArrows && totalPages > 1 && (
        <>
          <button
            onClick={prevPage}
            disabled={!canGoPrev}
            aria-label="Previous page"
            className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 
              p-2 rounded-full bg-white/20 backdrop-blur-sm
              hover:bg-white/30 active:bg-white/40
              transition-all duration-200 z-10
              disabled:opacity-0 disabled:pointer-events-none
              focus:outline-none focus:ring-2 focus:ring-white/50`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={nextPage}
            disabled={!canGoNext}
            aria-label="Next page"
            className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 
              p-2 rounded-full bg-white/20 backdrop-blur-sm
              hover:bg-white/30 active:bg-white/40
              transition-all duration-200 z-10
              disabled:opacity-0 disabled:pointer-events-none
              focus:outline-none focus:ring-2 focus:ring-white/50`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Page Indicators */}
      {showIndicators && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4" role="tablist">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              disabled={isAnimating}
              aria-label={`Go to page ${idx + 1}`}
              aria-current={idx === currentPage ? 'true' : 'false'}
              role="tab"
              className={`h-2 rounded-full transition-all duration-300 backdrop-blur-md
                ${
                  idx === currentPage
                    ? 'w-8 bg-white/80'
                    : 'w-2 bg-white/30 hover:bg-white/50'
                }
                focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1`}
            />
          ))}
        </div>
      )}

      {/* Screen reader announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Page {currentPage + 1} of {totalPages}
      </div>
    </div>
  );
}

export default SwipeableGrid;
