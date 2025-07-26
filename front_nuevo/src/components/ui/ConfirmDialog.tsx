import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2"
      onClick={handleBackdropClick}
    >
      <div className="bg-background border border-border rounded-lg max-w-md w-full mx-auto">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <p className="text-foreground">{message}</p>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border flex gap-3 justify-end">
          <button 
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${
              variant === 'destructive' 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}