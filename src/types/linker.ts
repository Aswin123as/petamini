export interface LinkPreview {
  title: string | null;
  description: string | null;
  image: string | null;
  logo: string | null;
}

export interface Link {
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

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
}

export interface CreateLinkerRequest {
  userId: number;
  username: string;
  content: string;
  type: 'url' | 'text';
  tags: string[];
}
