import { Loader2, Image as ImageIcon } from 'lucide-react';

interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
}

interface LinkPreviewProps {
  preview: LinkPreviewData | null;
  loading: boolean;
}

export function LinkPreview({ preview, loading }: LinkPreviewProps) {
  if (loading) {
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-center">
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
        <span className="ml-1.5 text-[10px] text-gray-500">
          Loading preview...
        </span>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="mt-2 bg-gray-50 rounded border border-gray-200 overflow-hidden">
      {preview.image && (
        <div className="relative w-full h-32 bg-gray-100">
          <img
            src={preview.image}
            alt={preview.title || 'Preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-2">
        {preview.logo && !preview.image && (
          <div className="flex items-center gap-1.5 mb-1">
            <img
              src={preview.logo}
              alt="Site logo"
              className="w-4 h-4 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        {preview.title && (
          <div className="flex items-start gap-1.5">
            {!preview.image && !preview.logo && (
              <ImageIcon className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
            )}
            <p className="text-[11px] font-medium text-gray-900 line-clamp-2">
              {preview.title}
            </p>
          </div>
        )}
        {preview.description && (
          <p className="text-[10px] text-gray-600 line-clamp-2 mt-0.5">
            {preview.description}
          </p>
        )}
      </div>
    </div>
  );
}
