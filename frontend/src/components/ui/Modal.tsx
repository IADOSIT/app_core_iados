import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ title, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${sizeMap[size]} w-full`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
          <button
            onClick={onClose}
            className="transition-colors rounded-lg p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
