import { Link2, Tag, Loader2 } from 'lucide-react';

interface CreatePostFormProps {
  inputText: string;
  inputTags: string;
  submitting: boolean;
  onTextChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onSubmit: () => void;
}

export function CreatePostForm({
  inputText,
  inputTags,
  submitting,
  onTextChange,
  onTagsChange,
  onSubmit,
}: CreatePostFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
    >
      <div className="space-y-2">
        {/* Text/URL Input */}
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none">
            <Link2 className="w-4 h-4 text-gray-400" />
          </div>
          <textarea
            value={inputText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Share a link or post..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={submitting}
          />
        </div>

        {/* Tags Input */}
        <div className="relative">
          <div className="absolute left-2.5 top-2.5 pointer-events-none">
            <Tag className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={inputTags}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="Add tags (comma separated)"
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={submitting}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || submitting}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-medium text-xs active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Posting...</span>
            </>
          ) : (
            <span>Post</span>
          )}
        </button>
      </div>
    </form>
  );
}
