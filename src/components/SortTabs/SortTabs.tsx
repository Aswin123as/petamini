import { Clock, TrendingUp, User } from 'lucide-react';

interface SortTabsProps {
  sortBy: 'recent' | 'popular' | 'my-posts';
  onSortChange: (sort: 'recent' | 'popular' | 'my-posts') => void;
}

export function SortTabs({ sortBy, onSortChange }: SortTabsProps) {
  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onSortChange('recent')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
          sortBy === 'recent'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 active:bg-gray-200'
        }`}
      >
        <Clock className="w-3.5 h-3.5" />
        <span>Recent</span>
      </button>
      <button
        onClick={() => onSortChange('popular')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
          sortBy === 'popular'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 active:bg-gray-200'
        }`}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span>Popular</span>
      </button>
      <button
        onClick={() => onSortChange('my-posts')}
        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
          sortBy === 'my-posts'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 active:bg-gray-200'
        }`}
      >
        <User className="w-3.5 h-3.5" />
        <span>My Posts</span>
      </button>
    </div>
  );
}
