import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import AuditService from '../services/audit.service';
import { useLanguage } from '../context/LanguageContext';

export default function AuditCommentModal({ onClose, onSuccess, branchName, branchId }: { onClose: () => void, onSuccess: () => void, branchName?: string, branchId?: number }) {
  const { t } = useLanguage();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError(t('Comment cannot be empty'));
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    try {
      const finalComment = branchName ? `[Branch: ${branchName}]\n\n${comment}` : comment;
      await AuditService.addComment(finalComment, branchId);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('Failed to add comment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Send size={16} />
            </div>
            {t('Add Audit Comment')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 min-h-0 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm font-medium">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {branchName && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Branch Name')}</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 font-medium flex items-center gap-2 cursor-not-allowed">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  {branchName}
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">{t('Your Comment / Remark')} *</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm min-h-[150px] resize-y"
                placeholder={t('Enter your findings or remarks here...')}
                required
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {t('Submit Comment')}
          </button>
        </div>
      </div>
    </div>
  );
}
