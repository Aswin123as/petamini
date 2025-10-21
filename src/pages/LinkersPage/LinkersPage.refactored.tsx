import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { linkerService } from '@/services/linkerService.ts';
import Toast from '@/components/Toast/Toast';
import { CreatePostForm } from '@/components/CreatePostForm/CreatePostForm';
import { SortTabs } from '@/components/SortTabs/SortTabs';
import { LinkCard } from '@/components/LinkCard/LinkCard';
import { EditPostModal } from '@/components/EditPostModal/EditPostModal';
import { getTelegramUser } from '@/utils/telegram';

// Types
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

export default function LinkersPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputTags, setInputTags] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'my-posts'>(
    'recent'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<Link | null>(null);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const telegramUser = getTelegramUser();

  // Fetch linkers from backend
  useEffect(() => {
    loadLinkers();
  }, [sortBy]);

  // Fetch link previews
  useEffect(() => {
    links.forEach((link) => {
      if (link.type === 'url' && link.previewLoading && !link.preview) {
        fetchLinkPreview(link.content, link.id);
      }
    });
  }, [links]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, message, type });
  };

  const loadLinkers = async () => {
    try {
      setLoading(true);
      setError(null);

      // For "my-posts", we load all recent posts and filter client-side
      const fetchSortBy = sortBy === 'my-posts' ? 'recent' : sortBy;
      const data = await linkerService.getAllLinkers(fetchSortBy);

      const convertedLinks: Link[] = data.map((linker) => ({
        ...linker,
        promoted: telegramUser
          ? linker.promotedBy.includes(telegramUser.id)
          : false,
        preview: null,
        previewLoading: linker.type === 'url',
      }));

      setLinks(convertedLinks);
    } catch (err) {
      console.error('Error loading linkers:', err);
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkPreview = async (url: string, linkId: string) => {
    try {
      const preview = await linkerService.fetchLinkPreview(url);

      setLinks((prevLinks) =>
        prevLinks.map((link) =>
          link.id === linkId
            ? {
                ...link,
                preview: preview || null,
                previewLoading: false,
              }
            : link
        )
      );
    } catch (error) {
      setLinks((prevLinks) =>
        prevLinks.map((link) =>
          link.id === linkId
            ? { ...link, preview: null, previewLoading: false }
            : link
        )
      );
    }
  };

  const isUrl = (text: string) => {
    const urlPattern =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return (
      urlPattern.test(text) ||
      text.includes('.com') ||
      text.includes('.org') ||
      text.includes('.net') ||
      text.includes('.io') ||
      text.includes('.dev') ||
      text.includes('.co')
    );
  };

  const handleSubmit = async () => {
    const trimmedText = inputText.trim();

    if (!trimmedText || !telegramUser) {
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

    const tags = inputTags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);

    try {
      setSubmitting(true);
      const newLinker = await linkerService.createLinker({
        userId: telegramUser.id,
        username: telegramUser.username,
        content: content,
        type: type,
        tags: tags,
      });

      const newLink: Link = {
        ...newLinker,
        promoted: false,
        preview: null,
        previewLoading: type === 'url',
      };

      setLinks([newLink, ...links]);
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

    try {
      const updatedLinker = await linkerService.promoteLinker(
        id,
        telegramUser.id
      );

      setLinks(
        links.map((link) => {
          if (link.id === id) {
            return {
              ...link,
              promotions: updatedLinker.promotions,
              promotedBy: updatedLinker.promotedBy,
              promoted: updatedLinker.promotedBy.includes(telegramUser.id),
            };
          }
          return link;
        })
      );
    } catch (err) {
      console.error('Error promoting linker:', err);
      showToast('Failed to promote post. Please try again.', 'error');
    }
  };

  const handleEdit = (id: string) => {
    const post = links.find((link) => link.id === id);
    if (post) {
      setEditingPost(post);
    }
  };

  const handleSaveEdit = async (
    postId: string,
    content: string,
    tags: string[]
  ) => {
    if (!telegramUser) return;

    try {
      const updatedLinker = await linkerService.updateLinker(
        postId,
        telegramUser.id,
        content,
        tags
      );

      setLinks(
        links.map((link) =>
          link.id === postId
            ? {
                ...link,
                content: updatedLinker.content,
                tags: updatedLinker.tags,
              }
            : link
        )
      );

      showToast('Post updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating post:', err);
      showToast('Failed to update post. Please try again.', 'error');
      throw err;
    }
  };

  const handleDelete = async (id: string) => {
    if (!telegramUser) {
      showToast('Please log in to delete posts', 'warning');
      return;
    }

    // Confirm deletion
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await linkerService.deleteLinker(id, telegramUser.id);
      setLinks(links.filter((link) => link.id !== id));
      showToast('Post deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast('Failed to delete post. Please try again.', 'error');
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString();
  };

  const getSortedLinks = () => {
    let filtered = [...links];

    // Filter for "My Posts" tab
    if (sortBy === 'my-posts' && telegramUser) {
      filtered = filtered.filter((link) => link.userId === telegramUser.id);
    }

    // Sort
    if (sortBy === 'popular') {
      return filtered.sort((a, b) => b.promotions - a.promotions);
    }
    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto px-3 py-4 space-y-3">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Linkers
          </h1>
          <p className="text-xs text-gray-600 mt-0.5">
            Share links and posts with the community
          </p>
        </div>

        {/* Create Post Form */}
        <CreatePostForm
          inputText={inputText}
          inputTags={inputTags}
          submitting={submitting}
          onTextChange={setInputText}
          onTagsChange={setInputTags}
          onSubmit={handleSubmit}
        />

        {/* Sort Tabs */}
        <SortTabs sortBy={sortBy} onSortChange={setSortBy} />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {/* Links List */}
        {!loading && (
          <div className="space-y-2">
            {getSortedLinks().map((link) => (
              <LinkCard
                key={link.id}
                {...link}
                onPromote={handlePromote}
                onEdit={handleEdit}
                onDelete={handleDelete}
                getTimeAgo={getTimeAgo}
                isOwner={telegramUser?.id === link.userId}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && getSortedLinks().length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            {sortBy === 'my-posts'
              ? "You haven't posted anything yet. Create your first post!"
              : 'No links yet. Post the first one!'}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          postId={editingPost.id}
          initialContent={editingPost.content}
          initialTags={editingPost.tags}
          onSave={handleSaveEdit}
          onClose={() => setEditingPost(null)}
        />
      )}
    </div>
  );
}

export { LinkersPage };
