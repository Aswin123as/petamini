import { ExternalLink, Flame, User, Edit2, Trash2 } from 'lucide-react';
import { LinkPreview } from '@/components/LinkCard/LinkPreview';

interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
}

interface LinkCardProps {
  id: string;
  userId: number;
  username: string;
  content: string;
  type: 'url' | 'text';
  tags: string[];
  promotions: number;
  promoted: boolean;
  timestamp: string;
  preview: LinkPreviewData | null;
  previewLoading: boolean;
  onPromote: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  getTimeAgo: (timestamp: string) => string;
  isOwner?: boolean;
}

export function LinkCard({
  id,
  username,
  content,
  type,
  tags,
  promotions,
  promoted,
  timestamp,
  preview,
  previewLoading,
  onPromote,
  onEdit,
  onDelete,
  getTimeAgo,
  isOwner = false,
}: LinkCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="w-3 h-3 text-white" />
            </div>
            <span className="font-medium text-xs text-gray-900 truncate">
              @{username}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Edit/Delete buttons for owner */}
            {isOwner && (
              <>
                {onEdit && (
                  <button
                    onClick={() => onEdit(id)}
                    className="p-1.5 rounded-full text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
                    title="Edit post"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(id)}
                    className="p-1.5 rounded-full text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}

            {/* Promote Button */}
            <button
              onClick={() => onPromote(id)}
              disabled={promoted}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                promoted
                  ? 'bg-orange-100 text-orange-700 cursor-not-allowed opacity-80'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200 hover:bg-gray-200'
              }`}
              title={promoted ? 'Already promoted' : 'Promote this post'}
            >
              <Flame
                className={`w-3 h-3 ${promoted ? 'fill-orange-500' : ''}`}
              />
              <span>{promotions}</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="mb-2">
          {type === 'url' ? (
            <a
              href={content}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="flex items-start gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-600 hover:text-blue-700 break-all line-clamp-2 group-active:text-blue-800">
                  {content}
                </p>
              </div>
            </a>
          ) : (
            <p className="text-xs text-gray-800 whitespace-pre-wrap break-words">
              {content}
            </p>
          )}

          {/* Link Preview */}
          {type === 'url' && (
            <LinkPreview preview={preview} loading={previewLoading} />
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-1.5 text-[10px] text-gray-500">
            {getTimeAgo(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}
