import React from 'react';
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'ඔව්, කරන්න',
  cancelText = 'නැත, ආපසු',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <Trash2 size={28} className="text-red-500" />,
      iconBg: 'bg-red-50 border-red-100',
      confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
    },
    warning: {
      icon: <AlertTriangle size={28} className="text-amber-500" />,
      iconBg: 'bg-amber-50 border-amber-100',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    },
    info: {
      icon: <CheckCircle size={28} className="text-blue-500" />,
      iconBg: 'bg-blue-50 border-blue-100',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        {/* Top accent line */}
        <div className={`h-1 w-full ${variant === 'danger' ? 'bg-red-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />

        <div className="p-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl border-2 ${styles.iconBg} flex items-center justify-center mb-4 mx-auto`}>
            {styles.icon}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-800 text-center mb-2">{title}</h3>

          {/* Message */}
          <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all duration-150"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-150 ${styles.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default ConfirmDialog;
