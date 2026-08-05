import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ModalWrapper } from '@/lib/motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return createPortal(
    <ModalWrapper isOpen={isOpen} onClose={onClose} className={className}>
      <div className="modal-header">
        <h2 id="modal-title" className="modal-title">{title}</h2>
        <button 
          type="button" 
          className="modal-close" 
          onClick={onClose}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      </div>
      <div className="modal-body">
        {children}
      </div>
    </ModalWrapper>,
    document.body
  );
};
