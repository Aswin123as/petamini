import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface EditPostModalProps {
  postId: string;
  initialContent: string;
  initialTags: string[];
  onSave: (postId: string, content: string, tags: string[]) => Promise<void>;
  onClose: () => void;
}

export function EditPostModal({
  postId,
  initialContent,
  initialTags,
  onSave,
  onClose,
}: EditPostModalProps) {
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags.join(', '));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;

    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    try {
      setSaving(true);
      await onSave(postId, content.trim(), tagArray);
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Edit Post</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full active:bg-gray-100 transition-colors"
            disabled={saving}
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2.5">
          {/* Content Input */}
          <div>
            <label className="block text-[10px] font-medium text-gray-900 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Post content..."
              className="w-full px-2.5 py-2 text-xs text-gray-900 border border-gray-200 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-transparent resize-none"
              rows={4}
              disabled={saving}
            />
          </div>

          {/* Tags Input */}
          <div>
            <label className="block text-[10px] font-medium text-gray-900 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tech, programming, tips"
              className="w-full px-2.5 py-2 text-xs text-gray-900 border border-gray-200 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-transparent"
              disabled={saving}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1.5 p-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-900 bg-gray-100 rounded-md active:bg-gray-200 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md active:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
