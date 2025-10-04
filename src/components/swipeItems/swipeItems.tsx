import { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SwipeableGridProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  keyExtractor: (item: T) => string | number;
  itemsPerPage?: number;
  columns?: number;
  gap?: number;
  showIndicators?: boolean;
  loop?: boolean;
  onPageChange?: (page: number) => void;
}

const SwipeableGrid = <T,>({
  items,
  renderItem,
  keyExtractor,
  itemsPerPage = 1,
  columns = 1,
  gap = 4,
  showIndicators = true,
  loop = false,
  onPageChange,
}: SwipeableGridProps<T>) => {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchState = useRef({ startX: 0, isDragging: false });

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

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

  const pageItems = useMemo(() => {
    return Array.from({ length: totalPages }).map((_, idx) =>
      items.slice(idx * itemsPerPage, (idx + 1) * itemsPerPage)
    );
  }, [items, itemsPerPage, totalPages]);

  const handleTouchStart = (e: TouchEvent) => {
    touchState.current.startX = e.touches[0].clientX;
    touchState.current.isDragging = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    const dx = e.touches[0].clientX - touchState.current.startX;
    if (!touchState.current.isDragging && Math.abs(dx) > 10) {
      touchState.current.isDragging = true;
      setIsDragging(true);
    }
    if (touchState.current.isDragging) setDragOffset(dx);
  };

  const handleTouchEnd = () => {
    if (!touchState.current.isDragging) return;
    const containerWidth = containerRef.current?.offsetWidth || 1;
    if (dragOffset > containerWidth * 0.15) prevPage();
    else if (dragOffset < -containerWidth * 0.15) nextPage();
    setDragOffset(0);
    setIsDragging(false);
    touchState.current.isDragging = false;
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
  }, [dragOffset]);

  return (
    <div className="relative w-full">
      {/* Swipeable container */}
      <div
        ref={containerRef}
        className="overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl p-4 select-none"
      >
        <div
          className={`flex transition-transform duration-300 ease-out`}
          style={{
            transform: `translateX(calc(${
              -currentPage * 100
            }% + ${dragOffset}px))`,
          }}
        >
          {pageItems.map((page, idx) => (
            <div
              key={idx}
              className={`flex-shrink-0 w-full grid gap-${gap} ${
                columns === 1
                  ? 'grid-cols-1'
                  : columns === 2
                  ? 'grid-cols-2'
                  : 'grid-cols-3'
              }`}
            >
              {page.map((item) => (
                <div key={keyExtractor(item)}>{renderItem(item)}</div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile swipe hints */}
      {totalPages > 1 && (
        <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none md:hidden animate-pulse">
          <span className="text-white/50 text-sm select-none">←</span>
          <span className="text-white/50 text-sm select-none">→</span>
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
                idx === currentPage ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Desktop arrows */}
      <button
        onClick={prevPage}
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 transition-all z-10"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={nextPage}
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 transition-all z-10"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>
    </div>
  );
};

export default SwipeableGrid;
