import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, Clock, User as UserIcon, Calendar, Filter, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import AuditService, { type AuditComment } from '../services/audit.service';
import { getCurrentUser } from '../services/auth.service';
import { useLanguage } from '../context/LanguageContext';

export default function AuditorCommentsView() {
  const { t } = useLanguage();
  const [comments, setComments] = useState<AuditComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  
  
  const getBranchNameStr = (branchId: number) => {
    const branchMap: Record<number, string> = {
      1: 'Main Branch',
      2: 'Dodanduwa Branch',
      3: 'Rathgama Branch',
      4: 'Seenigama Branch',
      5: 'Thiranagama Branch',
      6: 'Peraliya Branch',
      7: 'Kalupe Branch',
      8: 'Gonapinuwala Branch',
    };
    return branchMap[branchId] || 'Main Branch';
  };

  const currentUser = getCurrentUser();
  const isAuditor = currentUser?.role === 'AUDITOR';
  const isBranchManager = currentUser?.role === 'BRANCH_MANAGER';

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await AuditService.getComments();
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await AuditService.markAsRead(id);
      fetchComments();
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAsResolved = async (id: number) => {
    const result = await Swal.fire({
      title: t('Are you sure?'),
      text: t("You want to mark this comment as resolved?"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#cbd5e1',
      confirmButtonText: t('Yes, mark as resolved'),
      cancelButtonText: t('Cancel')
    });

    if (!result.isConfirmed) {
      return;
    }
    
    try {
      await AuditService.resolveComment(id);
      Swal.fire({
        title: t('Resolved!'),
        text: t('Comment successfully marked as resolved!'),
        icon: 'success',
        confirmButtonColor: '#10b981'
      });
      fetchComments();
    } catch (error) {
      console.error('Failed to resolve comment', error);
      Swal.fire({
        title: t('Error!'),
        text: t('Failed to resolve comment. Please try again.'),
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const parseComment = (text: string) => {
    const match = text.match(/^\[Branch: (.*?)\]\n\n(.*)$/s);
    if (match) {
      return { branch: match[1], problem: match[2] };
    }
    return { branch: null, problem: text };
  };

  const filteredComments = comments.filter(c => {
// Temporary removal of branch filtering for debugging
    
    if (dateFilter === 'all') return true;
    const date = new Date(c.createdAt);
    const now = new Date();
    if (dateFilter === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (dateFilter === 'week') {
      const diff = now.getTime() - date.getTime();
      return diff <= 7 * 24 * 60 * 60 * 1000;
    }
    if (dateFilter === 'month') {
      const diff = now.getTime() - date.getTime();
      return diff <= 30 * 24 * 60 * 60 * 1000;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 bg-slate-50/50">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      <div className="p-6 border-b border-slate-200 bg-white shrink-0">
        <div className="max-w-5xl mx-auto flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                <MessageSquare size={20} />
              </div>
              {t('Auditor Comments & Remarks')}
            </h2>
            <p className="text-slate-500 mt-1 text-sm font-medium ml-12">
              {t('Review and acknowledge findings reported by the internal auditor')}
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="all">{t('All Time')}</option>
              <option value="today">{t('Today')}</option>
              <option value="week">{t('Last 7 Days')}</option>
              <option value="month">{t('Last 30 Days')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {filteredComments.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">{t('No Comments Found')}</h3>
              <p className="text-slate-500 max-w-md mx-auto">{t('There are no auditor remarks matching your criteria.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">{t('Date & Time')}</th>
                    <th className="p-4">ගැටලුව පවතින ශාඛාව</th>
                    <th className="p-4">{t('Auditor')}</th>
                    <th className="p-4">{t('Problem / Remark')}</th>
                    <th className="p-4">{t('Status')}</th>
                    <th className="p-4 text-right">{t('Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredComments.map(comment => {
                    const parsed = parseComment(comment.comment);
                    const createdDate = new Date(comment.createdAt);
                    return (
                      <tr key={comment.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 align-top whitespace-nowrap">
                          <div className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              {createdDate.toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock size={13} className="text-slate-400" />
                              {createdDate.toLocaleTimeString()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-top whitespace-nowrap">
                          {parsed.branch && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                              <MapPin size={13} />
                              {comment.branchId ? getBranchNameStr(comment.branchId) : parsed.branch}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                              <UserIcon size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">{comment.auditorName}</span>
                              <span className="text-[10px] font-bold text-slate-500">{comment.auditorUsername}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top min-w-[300px] max-w-[500px]">
                          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{parsed.problem}</p>
                          {comment.status !== 'UNREAD' && comment.readBy && (
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                              <CheckCircle2 size={13} className={comment.status === 'RESOLVED' ? "text-emerald-500" : "text-blue-500"} />
                              {comment.status === 'RESOLVED' ? (
                                <span><strong className="text-slate-700">{t('Resolved by')}</strong> {comment.readBy}</span>
                              ) : (
                                <span><strong className="text-slate-700">{t('Read by')}</strong> {comment.readBy}</span>
                              )}
                              <span className="text-slate-300 mx-1">•</span>
                              {new Date(comment.readAt!).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="p-4 align-top whitespace-nowrap">
                          {comment.status === 'RESOLVED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200">
                              <CheckCircle2 size={12} /> {t('Resolved')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider border border-amber-200">
                              <Clock size={12} /> {t('Pending')}
                            </span>
                          )}
                        </td>
                        <td className="p-4 align-top whitespace-nowrap text-right">
                          {!isAuditor && comment.status !== 'RESOLVED' && (
                            <button
                              onClick={() => markAsResolved(comment.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                            >
                              <CheckCircle2 size={14} />
                              {t('Mark as Resolved')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
