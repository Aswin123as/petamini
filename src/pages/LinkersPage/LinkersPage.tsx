import { useState } from 'react';
import {
  TrendingUp,
  Link2,
  Clock,
  Flame,
  ExternalLink,
  Tag,
  Loader2,
  AlertCircle,
  Edit2,
  Trash2,
  User,
} from 'lucide-react';
import { linkerService } from '@/services/linkerService.ts';
import { linkerRepository } from '@/services/linkerRepository';
import { useCachedLinkers } from '@/hooks/useCachedLinkers';
import Toast from '@/components/Toast/Toast';
import { EditPostModal } from '@/components/EditPostModal/EditPostModal';

interface LinkPreview {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
}

interface Link {
  id: string;
  userId: number;
  username: string;
  content: string;
  type: 'url' | 'text';
  tags: string[];
  promotions: number;
  promotedBy: number[];
  timestamp: string;
  createdAt: string;
  promoted: boolean;
  preview: LinkPreview | null;
  previewLoading: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
}

// Get Telegram user data
const getTelegramUser = () => {
  // Check for development mode
  const isDevelopment = import.meta.env.DEV;

  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const user = window.Telegram.WebApp.initDataUnsafe?.user;
    if (user) {
      return {
        id: user.id,
        username: user.username || user.first_name || 'User',
      };
    }
  }

  // Fallback for development/testing
  if (isDevelopment) {
    console.log('⚠️ Development mode: Using mock Telegram user');
    return {
      id: 123456789,
      username: 'DevUser',
    };
  }

  return null;
};

export default function LinkSharingApp() {
  const [inputText, setInputText] = useState('');
  const [inputTags, setInputTags] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'my-posts'>(
    'recent'
  );
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const telegramUser = getTelegramUser();

  // Use cached linkers hook (only for recent/popular, not my-posts)
  const sortParam = sortBy === 'my-posts' ? 'recent' : sortBy;
  const {
    linkers: cachedLinkers,
    loading,
    error: cacheError,
    refresh: refreshCache,
  } = useCachedLinkers(sortParam);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, message, type });
  };

  // Convert cached linkers to Link format with promoted status
  const links: Link[] = cachedLinkers.map((linker) => ({
    ...linker,
    promoted: telegramUser
      ? linker.promotedBy.includes(telegramUser.id)
      : false,
    preview: null,
    previewLoading: linker.type === 'url',
  }));

  const error = cacheError;

  const isUrl = (text: string) => {
    // Check if text starts with common URL protocols
    if (text.startsWith('http://') || text.startsWith('https://')) {
      return true;
    }

    // Check for common domains and TLDs
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.\-\+\?=&%#]*)*\/?$/i;

    return (
      urlPattern.test(text) ||
      text.includes('.com') ||
      text.includes('.org') ||
      text.includes('.net') ||
      text.includes('.io') ||
      text.includes('.dev') ||
      text.includes('.co') ||
      text.includes('t.me/') || // Telegram links
      text.includes('telegram.me/') // Telegram alternative domain
    );
  };

  const handleSubmit = async () => {
    const trimmedText = inputText.trim();

    if (!trimmedText || !telegramUser) {
      return;
    }

    // Check word count (250 word limit)
    const wordCount = trimmedText
      ? trimmedText.split(/\s+/).filter((word) => word.length > 0).length
      : 0;
    if (wordCount > 250) {
      showToast('Post must be 250 words or less', 'error');
      return;
    }

    let content = trimmedText;
    let type: 'url' | 'text' = 'text';

    if (isUrl(trimmedText)) {
      type = 'url';
      if (
        !trimmedText.startsWith('http://') &&
        !trimmedText.startsWith('https://')
      ) {
        content = 'https://' + trimmedText;
      }
    }

    // Process tags (limit to 2 tags)
    const tags = inputTags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0)
      .slice(0, 2); // Limit to 2 tags

    if (inputTags.split(',').filter((t) => t.trim()).length > 2) {
      showToast('Maximum 2 tags allowed', 'warning');
    }

    try {
      setSubmitting(true);
      const newLinker = await linkerService.createLinker({
        userId: telegramUser.id,
        username: telegramUser.username,
        content: content,
        type: type,
        tags: tags,
      });

      // Update cache with new linker
      linkerRepository.updateCacheAfterCreate(newLinker);

      // Refresh to show new post
      await refreshCache();

      setInputText('');
      setInputTags('');
      showToast('Post created successfully!', 'success');
    } catch (err) {
      console.error('Error creating linker:', err);
      showToast('Failed to create post. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromote = async (id: string) => {
    if (!telegramUser) {
      showToast('Please log in to promote posts', 'warning');
      return;
    }

    // Check if user already promoted this post
    const link = links.find((l) => l.id === id);
    if (link && link.promoted) {
      // Already promoted - do nothing (one user one like)
      return;
    }

    try {
      const updatedLinker = await linkerService.promoteLinker(
        id,
        telegramUser.id
      );

      // Update cache after promotion
      linkerRepository.updateCacheAfterPromote(id, updatedLinker);

      // Refresh to show updated promotions
      await refreshCache();
    } catch (err) {
      console.error('Error promoting linker:', err);
      showToast('Failed to promote post. Please try again.', 'error');
    }
  };

  const handleEdit = (link: Link) => {
    setEditingLink(link);
  };

  const handleSaveEdit = async (
    postId: string,
    content: string,
    tags: string[]
  ) => {
    if (!telegramUser) return;

    try {
      await linkerService.updateLinker(postId, telegramUser.id, content, tags);

      // Invalidate cache to force fresh data on next load
      linkerRepository.invalidateCache();

      // Refresh to show updated post
      await refreshCache();

      setEditingLink(null);
      showToast('Post updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating post:', err);
      showToast('Failed to update post', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!telegramUser) return;

    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await linkerService.deleteLinker(id, telegramUser.id);

      // Update cache after deletion
      linkerRepository.updateCacheAfterDelete(id);

      // Refresh to remove deleted post
      await refreshCache();

      showToast('Post deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('Failed to delete post', 'error');
    }
  };

  const getSortedLinks = () => {
    let filtered = [...links];

    // Filter by user for my-posts tab
    if (sortBy === 'my-posts' && telegramUser) {
      filtered = filtered.filter((link) => link.userId === telegramUser.id);
    }

    if (sortBy === 'popular') {
      return filtered.sort((a, b) => b.promotions - a.promotions);
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(timestamp).getTime()) / 1000
    );
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  if (!telegramUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Telegram Required
          </h2>
          <p className="text-xs text-gray-600">
            Please open this app through Telegram to post links
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-3 py-4 pb-20">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-xl font-semibold text-gray-900">Linkers</h1>
          <span className="text-gray-300">·</span>
          <p className="text-xs text-gray-600">Share and discover links</p>
        </div>

        {/* Current User Info - Frappé UI Inspired Black & White */}
        <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3.5 hover:border-gray-300 transition-colors">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 bg-gray-900 rounded-md flex items-center justify-center">
                <span className="text-white font-medium text-base tracking-tight">
                  {telegramUser.username.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900 tracking-tight truncate">
                  {telegramUser.username}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-mono tracking-tight">
                  {telegramUser.id}
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500">
                  {links.filter((l) => l.userId === telegramUser.id).length}{' '}
                  {links.filter((l) => l.userId === telegramUser.id).length ===
                  1
                    ? 'post'
                    : 'posts'}
                </span>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md border border-gray-200">
              <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
              <span className="text-xs text-gray-700 font-medium tracking-tight">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className="mb-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit();
                }
              }}
              placeholder="Share a link or write something..."
              rows={3}
              className="w-full px-0 py-0 text-sm text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-0 resize-none"
              disabled={submitting}
            />
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Tag size={12} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={inputTags}
                  onChange={(e) => setInputTags(e.target.value)}
                  placeholder="Add up to 2 tags (comma separated)..."
                  className="flex-1 px-0 py-0 text-xs text-gray-900 placeholder-gray-400 border-0 focus:outline-none focus:ring-0"
                  disabled={submitting}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="leading-tight">Ctrl+Enter</span>
                  <span>·</span>
                  <span
                    className={`leading-tight ${
                      inputText.trim() &&
                      inputText
                        .trim()
                        .split(/\s+/)
                        .filter((word) => word.length > 0).length > 250
                        ? 'text-red-500 font-medium'
                        : ''
                    }`}
                  >
                    {inputText.trim()
                      ? inputText
                          .trim()
                          .split(/\s+/)
                          .filter((word) => word.length > 0).length
                      : 0}
                    /250 words
                  </span>
                  <span>·</span>
                  <span
                    className={`leading-tight ${
                      inputTags.split(',').filter((t) => t.trim()).length > 2
                        ? 'text-red-500 font-medium'
                        : ''
                    }`}
                  >
                    {inputTags.split(',').filter((t) => t.trim()).length}/2 tags
                  </span>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !inputText.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md active:bg-gray-800 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-0.5 mb-3 border-b border-gray-200">
          <button
            onClick={() => setSortBy('recent')}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
              sortBy === 'recent'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 active:text-gray-900'
            }`}
          >
            <Clock size={14} />
            Recent
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
              sortBy === 'popular'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 active:text-gray-900'
            }`}
          >
            <Flame size={14} />
            Popular
          </button>
          <button
            onClick={() => setSortBy('my-posts')}
            className={`flex items-center gap-1 px-3 py-2 text-xs font-medium transition-colors ${
              sortBy === 'my-posts'
                ? 'text-gray-900 border-b-2 border-gray-900'
                : 'text-gray-600 active:text-gray-900'
            }`}
          >
            <User size={14} />
            My Posts
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Links List */}
        {!loading && (
          <div className="space-y-2">
            {getSortedLinks().map((link) => (
              <div
                key={link.id}
                className="bg-white border border-gray-200 rounded-lg p-3 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => handlePromote(link.id)}
                    disabled={link.promoted}
                    className={`flex flex-col items-center gap-0.5 min-w-[32px] group ${
                      link.promoted
                        ? 'opacity-100 cursor-default'
                        : 'opacity-70 cursor-pointer'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                        link.promoted ? 'bg-blue-50' : 'active:bg-gray-100'
                      }`}
                    >
                      <TrendingUp
                        className={`transition-colors ${
                          link.promoted
                            ? 'text-blue-600'
                            : 'text-gray-500 group-active:text-blue-600'
                        }`}
                        size={16}
                      />
                    </div>
                    <span
                      className={`text-[10px] font-medium ${
                        link.promoted ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {link.promotions}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    {link.type === 'url' ? (
                      <div>
                        {link.previewLoading ? (
                          <div className="animate-pulse">
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5"></div>
                            <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ) : link.preview ? (
                          <a
                            href={link.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                          >
                            <div className="border border-gray-200 rounded-md active:border-gray-300 transition-colors p-2">
                              <div className="flex items-start gap-2">
                                {link.preview.image && (
                                  <img
                                    src={link.preview.image}
                                    alt={link.preview.title || 'Preview'}
                                    className="w-12 h-12 object-cover rounded flex-shrink-0"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start gap-1.5 mb-0.5">
                                    {link.preview.logo && (
                                      <img
                                        src={link.preview.logo}
                                        alt="Logo"
                                        className="w-3 h-3 rounded mt-0.5 flex-shrink-0"
                                        onError={(e) => {
                                          (
                                            e.target as HTMLImageElement
                                          ).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[11px] font-medium text-gray-900 group-active:text-blue-600 transition-colors line-clamp-1">
                                        {link.preview.title ||
                                          getDomain(link.content)}
                                      </div>
                                      {link.preview.description && (
                                        <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                                          {link.preview.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-0.5 mt-0.5">
                                        <ExternalLink
                                          size={10}
                                          className="text-gray-400"
                                        />
                                        <span className="text-[10px] text-gray-500 truncate">
                                          {getDomain(link.content)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </a>
                        ) : (
                          <a
                            href={link.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                          >
                            <div className="border border-gray-200 rounded-md p-2.5 active:border-gray-300 transition-colors bg-gray-50">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Link2
                                  size={14}
                                  className="text-gray-400 flex-shrink-0"
                                />
                                <span className="text-[10px] text-gray-500 truncate">
                                  {getDomain(link.content)}
                                </span>
                              </div>
                              <div className="text-xs text-gray-900 group-active:text-blue-600 transition-colors break-all">
                                {link.content}
                              </div>
                            </div>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-gray-900 break-words leading-relaxed">
                          {link.content}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {link.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 active:bg-gray-200 transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="text-[10px] text-gray-500">
                        {getTimeAgo(link.timestamp)}
                      </div>

                      {/* Edit/Delete buttons for own posts */}
                      {telegramUser && link.userId === telegramUser.id && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-1 text-gray-900 hover:bg-gray-100 rounded transition-colors"
                            title="Edit post"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-1 text-gray-900 hover:bg-gray-100 rounded transition-colors"
                            title="Delete post"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && links.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No links yet. Post the first one!
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingLink && (
        <EditPostModal
          postId={editingLink.id}
          initialContent={editingLink.content}
          initialTags={editingLink.tags}
          onClose={() => setEditingLink(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
}

export { LinkSharingApp as LinkersPage };
