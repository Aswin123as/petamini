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
  itemsPerPage = 1,
  columns = 1,
  gap = 4,
  showIndicators = true,
  showArrows = true,
  loop = false,
  onPageChange,
}: SwipeableGridProps<T>): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [showArrowHint, setShowArrowHint] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const touchState = useRef({ startX: 0, startTime: 0, isDragging: false });

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Show mobile swipe hint for 2.5s
  useEffect(() => {
    const timer = setTimeout(
      () => setShowArrowHint(false),
      SWIPE_HINT_DURATION
    );
    return () => clearTimeout(timer);
  }, []);

  const goToPage = (page: number) => {
    const newPage = loop
      ? ((page % totalPages) + totalPages) % totalPages
      : Math.max(0, Math.min(page, totalPages - 1));
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
    onPageChange?.(newPage);
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // Precompute pages
  const pageItems = useMemo(() => {
    return Array.from({ length: totalPages }).map((_, idx) =>
      items.slice(idx * itemsPerPage, (idx + 1) * itemsPerPage)
    );
  }, [items, itemsPerPage, totalPages]);

  // Rubber-band effect for edge swipes
  const applyRubberBand = (distance: number, width: number) => {
    const constant = 0.55;
    const absDist = Math.abs(distance);
    const result = (1 - 1 / ((absDist * constant) / width + 1)) * width;
    return distance < 0 ? -result : result;
  };

  // Touch handling
  const handleTouchStart = (e: TouchEvent) => {
    touchState.current.startX = e.touches[0].clientX;
    touchState.current.startTime = Date.now();
    touchState.current.isDragging = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const dx = e.touches[0].clientX - touchState.current.startX;

    if (!touchState.current.isDragging && Math.abs(dx) > 10) {
      touchState.current.isDragging = true;
      setIsDragging(true);
    }

    if (!touchState.current.isDragging) return;

    e.preventDefault();
    const containerWidth = containerRef.current?.offsetWidth || 1;

    let offsetX = dx;

    // Apply rubber-band if at edges
    if (!loop) {
      if (currentPage === 0 && dx > 0)
        offsetX = applyRubberBand(dx, containerWidth);
      if (currentPage === totalPages - 1 && dx < 0)
        offsetX = applyRubberBand(dx, containerWidth);
    }

    setDragOffset(offsetX);
  };

  const handleTouchEnd = () => {
    if (!touchState.current.isDragging) return;
    const containerWidth = containerRef.current?.offsetWidth || 1;
    const dx = dragOffset;
    const dt = Date.now() - touchState.current.startTime;
    const velocity = Math.abs(dx) / dt;

    setIsDragging(false);
    setDragOffset(0);
    touchState.current.isDragging = false;

    if (
      Math.abs(dx) > containerWidth * MIN_SWIPE_THRESHOLD ||
      velocity > VELOCITY_THRESHOLD
    ) {
      if (dx > 0) prevPage();
      else if (dx < 0) nextPage();
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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
  }, [dragOffset, currentPage, totalPages]);

  // Keyboard support
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') nextPage();
    else if (e.key === 'ArrowLeft') prevPage();
    else if (e.key === 'Home') goToPage(0);
    else if (e.key === 'End') goToPage(totalPages - 1);
  };

  // Responsive grid classes
  const getGridCols = () => {
    if (columns === 1) return 'grid-cols-1';
    if (columns === 2) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  const gapClass = `gap-${gap}`;

  return (
    <div
      className="relative w-full outline-none"
      tabIndex={0}
      onKeyDown={onKeyDown}
      role="region"
      aria-label="Swipeable grid"
      aria-roledescription="carousel"
    >
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl select-none shadow-lg border border-white/10"
      >
        <div
          className={`flex transition-transform duration-[${ANIMATION_DURATION}ms] ease-out`}
          style={{
            transform: `translateX(calc(${
              -currentPage * 100
            }% + ${dragOffset}px))`,
          }}
        >
          {pageItems.map((page, idx) => (
            <div key={idx} className="flex-shrink-0 w-full px-4 py-4">
              <div className={`grid ${getGridCols()} ${gapClass}`}>
                {page.map((item) => (
                  <div
                    key={keyExtractor(item)}
                    className="transition-transform hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                  >
                    {renderItem(item)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile swipe hints */}
      {showArrowHint && totalPages > 1 && (
        <div className="absolute inset-0 flex justify-between items-center px-8 pointer-events-none md:hidden">
          <span className="animate-pulse text-white/70 text-2xl select-none drop-shadow-lg">
            ←
          </span>
          <span className="animate-pulse text-white/70 text-2xl select-none drop-shadow-lg">
            →
          </span>
        </div>
      )}

      {/* Page indicators */}
      {showIndicators && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToPage(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentPage
                  ? 'w-8 bg-white scale-110'
                  : 'w-2 bg-white/40 hover:scale-105'
              }`}
              aria-label={`Go to page ${idx + 1}`}
              aria-current={idx === currentPage ? 'true' : 'false'}
              role="tab"
            />
          ))}
        </div>
      )}

      {/* Desktop arrows */}
      {showArrows && totalPages > 1 && (
        <>
          <button
            onClick={prevPage}
            disabled={currentPage === 0 && !loop}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all z-10"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1 && !loop}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all z-10"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}
    </div>
  );
}

export default SwipeableGrid;
