import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning';
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-4 h-4 text-green-600" />,
    error: <XCircle className="w-4 h-4 text-red-600" />,
    warning: <AlertCircle className="w-4 h-4 text-orange-600" />,
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-orange-50 border-orange-200 text-orange-900',
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md animate-slide-down">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border shadow-lg ${styles[type]}`}
      >
        <div className="flex-shrink-0">{icons[type]}</div>
        <p className="flex-1 text-xs font-medium">{message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-0.5 rounded hover:bg-black/5 active:bg-black/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
