with open('src/components/PawningApprovalsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for ConfirmDialog
content = "import ConfirmDialog from './ConfirmDialog';\n" + content

# 2. Update PawningReviewModal with ConfirmDialog state and handlers
old_modal_start = '''function PawningReviewModal({ ticket, onClose, onAction, memberDetails, branchName, showToast }: { ticket: any; onClose: () => void; onAction: () => void; memberDetails: any; branchName: string; showToast?: (msg: string, severity?: 'success' | 'error' | 'warning' | 'info') => void }) {
  const [assessedValue, setAssessedValue] = useState(ticket.assessedValue || '');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');'''

new_modal_start = '''function PawningReviewModal({ ticket, onClose, onAction, memberDetails, branchName, showToast }: { ticket: any; onClose: () => void; onAction: () => void; memberDetails: any; branchName: string; showToast?: (msg: string, severity?: 'success' | 'error' | 'warning' | 'info') => void }) {
  const [assessedValue, setAssessedValue] = useState(ticket.assessedValue || '');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    onConfirm: () => {}
  });'''

content = content.replace(old_modal_start, new_modal_start)
content = content.replace(old_modal_start.replace('\n', '\r\n'), new_modal_start.replace('\n', '\r\n'))

# 3. Update handleApprove and handleReject logic to use ConfirmDialog
old_handlers = '''  const handleApprove = async () => {
    console.log('handleApprove clicked. Ticket:', ticket, 'Assessed Value:', assessedValue, 'Remarks:', remarks);
    if (!assessedValue || isNaN(Number(assessedValue))) {
      setError('කරුණාකර නිවැරදි තක්සේරු වටිනාකමක් ඇතුළත් කරන්න.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Calling PawningService.approveTicket with ID:', ticket.ticketId);
      const result = await PawningService.approveTicket(ticket.ticketId, {
        assessedValue: Number(assessedValue),
        remarks
      });
      console.log('Approve API call success:', result);
      if (showToast) {
        showToast('✅ උකස් පත්‍රිකාව සාර්ථකව අනුමත කරන ලදී! ශාඛාවට දැනුම් දී ඇත.', 'success');
      } else {
        (window as any).showToast?.('✅ උකස් පත්‍රිකාව සාර්ථකව අනුමත කරන ලදී! ශාඛාවට දැනුම් දී ඇත.');
      }
      onAction();
      onClose();
    } catch (err: any) {
      console.error('Approve API call failed:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || String(err);
      setError('දෝෂයක් ඇතිවිය: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    console.log('handleReject clicked. Ticket:', ticket, 'Remarks:', remarks);
    if (!remarks.trim()) {
      setError('ප්‍රතික්ෂේප කිරීමේ හේතුව remarks ලෙස ඇතුළත් කරන්න.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Calling PawningService.approveTicket (Reject) with ID:', ticket.ticketId);
      const result = await PawningService.approveTicket(ticket.ticketId, {
        assessedValue: 0,
        remarks: `[REJECTED] ${remarks}`
      });
      console.log('Reject API call success:', result);
      if (showToast) {
        showToast('❌ උකස් පත්‍රිකාව ප්‍රතික්ෂේප කරන ලදී.', 'error');
      } else {
        (window as any).showToast?.('❌ උකස් පත්‍රිකාව ප්‍රතික්ෂේප කරන ලදී.');
      }
      onAction();
      onClose();
    } catch (err: any) {
      console.error('Reject API call failed:', err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || String(err);
      setError('දෝෂයක් ඇතිවිය: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };'''

new_handlers = '''  const handleApprove = async () => {
    console.log('handleApprove clicked. Ticket:', ticket, 'Assessed Value:', assessedValue, 'Remarks:', remarks);
    if (!assessedValue || isNaN(Number(assessedValue))) {
      setError('කරුණාකර නිවැරදි තක්සේරු වටිනාකමක් ඇතුළත් කරන්න.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'උකස් අයදුම්පත අනුමත කරන්නද?',
      message: `තක්සේරු මුදල රු. ${Number(assessedValue).toLocaleString()} ලෙස මෙම උකස් පත්‍රිකාව අනුමත කිරීමට අවශ්‍ය බව විශ්වාසද?`,
      variant: 'info',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, isOpen: false }));
        setLoading(true);
        setError('');
        try {
          console.log('Calling PawningService.approveTicket with ID:', ticket.ticketId);
          const result = await PawningService.approveTicket(ticket.ticketId, {
            assessedValue: Number(assessedValue),
            remarks
          });
          console.log('Approve API call success:', result);
          if (showToast) {
            showToast('✅ උකස් පත්‍රිකාව සාර්ථකව අනුමත කරන ලදී! ශාඛාවට දැනුම් දී ඇත.', 'success');
          } else {
            (window as any).showToast?.('✅ උකස් පත්‍රිකාව සාර්ථකව අනුමත කරන ලදී! ශාඛාවට දැනුම් දී ඇත.');
          }
          onAction();
          onClose();
        } catch (err: any) {
          console.error('Approve API call failed:', err);
          const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || String(err);
          setError('දෝෂයක් ඇතිවිය: ' + errMsg);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleReject = async () => {
    console.log('handleReject clicked. Ticket:', ticket, 'Remarks:', remarks);
    if (!remarks.trim()) {
      setError('ප්‍රතික්ෂේප කිරීමේ හේතුව remarks ලෙස ඇතුළත් කරන්න.');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'උකස් අයදුම්පත ප්‍රතික්ෂේප කරන්නද?',
      message: 'මෙම උකස් පත්‍රිකාව ප්‍රතික්ෂේප කිරීමට අවශ්‍ය බව විශ්වාසද? මෙය ආපසු හැරවිය නොහැක.',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(d => ({ ...d, isOpen: false }));
        setLoading(true);
        setError('');
        try {
          console.log('Calling PawningService.approveTicket (Reject) with ID:', ticket.ticketId);
          const result = await PawningService.approveTicket(ticket.ticketId, {
            assessedValue: 0,
            remarks: `[REJECTED] ${remarks}`
          });
          console.log('Reject API call success:', result);
          if (showToast) {
            showToast('❌ උකස් පත්‍රිකාව ප්‍රතික්ෂේප කරන ලදී.', 'error');
          } else {
            (window as any).showToast?.('❌ උකස් පත්‍රිකාව ප්‍රතික්ෂේප කරන ලදී.');
          }
          onAction();
          onClose();
        } catch (err: any) {
          console.error('Reject API call failed:', err);
          const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || String(err);
          setError('දෝෂයක් ඇතිවිය: ' + errMsg);
        } finally {
          setLoading(false);
        }
      }
    });
  };'''

content = content.replace(old_handlers, new_handlers)
content = content.replace(old_handlers.replace('\n', '\r\n'), new_handlers.replace('\n', '\r\n'))

# 4. Inject ConfirmDialog component into modal return and add inline error messages
old_modal_return = '''  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-100">'''

new_modal_return = '''  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
      />
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto border border-slate-100">'''

content = content.replace(old_modal_return, new_modal_return)
content = content.replace(old_modal_return.replace('\n', '\r\n'), new_modal_return.replace('\n', '\r\n'))

# 5. Make input validation error visually explicit
old_input = '''            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">තක්සේරු වටිනාකම / අනුමත කරන මුදල (Rs.) *</label>
              <input 
                type="number" 
                value={assessedValue} 
                onChange={e => setAssessedValue(e.target.value)}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-semibold focus:border-blue-500 focus:outline-none"
                placeholder="උදා: 50000.00"
              />
            </div>'''

new_input = '''            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">තක්සේරු වටිනාකම / අනුමත කරන මුදල (Rs.) *</label>
              <input 
                type="number" 
                value={assessedValue} 
                onChange={e => { setAssessedValue(e.target.value); setError(''); }}
                className={`w-full border-2 rounded-xl px-4 py-3 font-semibold focus:outline-none ${error && !assessedValue ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-blue-500'}`}
                placeholder="උදා: 50000.00"
              />
              {error && !assessedValue && (
                <p className="text-xs text-red-600 font-bold mt-1">{error}</p>
              )}
            </div>'''

content = content.replace(old_input, new_input)
content = content.replace(old_input.replace('\n', '\r\n'), new_input.replace('\n', '\r\n'))

with open('src/components/PawningApprovalsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
