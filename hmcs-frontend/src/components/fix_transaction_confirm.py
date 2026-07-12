with open('src/components/TransactionModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import for useLanguage
old_imports = """import * as AccountService from '../services/account.service';"""
new_imports = """import * as AccountService from '../services/account.service';
import { useLanguage } from '../context/LanguageContext';"""

# 2. Add useLanguage hooks & showConfirm state in TransactionModal
old_component_start = """export default function TransactionModal({ accountId, accountNumber, accountType, balance = 0, accountHolder = 'N/A', action, onClose, onSuccess, allAccounts = [], members = [] }: Props) {
  if (window.__isAdminView) return"""

new_component_start = """export default function TransactionModal({ accountId, accountNumber, accountType, balance = 0, accountHolder = 'N/A', action, onClose, onSuccess, allAccounts = [], members = [] }: Props) {
  const { t, language } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  if (window.__isAdminView) return"""

# 3. Update handleTransaction to support confirmation step
old_handle_tx = """  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount && action !== 'CLOSE_FD') return;
    if (isInsufficientBalance || isInvalidAccount) return;
    
    setLoading(true);"""

new_handle_tx = """  const handleTransaction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount && action !== 'CLOSE_FD') return;
    if (isInsufficientBalance || isInvalidAccount) return;

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setLoading(true);"""

# 4. Translate success receipt page
old_receipt_page = """  if (isSuccess && receiptData) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{receiptData.type === 'PENDING_APPROVAL' ? 'Approval Requested' : 'Transaction Successful'}</h2>
          <p className="text-slate-500 font-medium mb-8">
            {receiptData.type === 'PENDING_APPROVAL' 
              ? `Request sent to Branch Manager to withdraw Rs. ${Number(receiptData.amount).toLocaleString()} from the account.` 
              : receiptData.type === 'CLOSE_FD'
              ? `FD closed. Rs. ${Number(receiptData.amount).toLocaleString()} credited to savings account.`
              : `Rs. ${Number(receiptData.amount).toLocaleString()} has been ${action === 'DEPOSIT' ? 'deposited to' : 'withdrawn from'} the account.`}
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? 'Request ID:' : 'Txn ID:'}</span> <span className="font-mono font-bold text-slate-700">{receiptData.transactionId}</span></div>
            {receiptData.type === 'CLOSE_FD' ? (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Credited Amount:</span> <span className="font-bold text-slate-800">Rs. {receiptData.amount.toLocaleString()}</span></div>
                {receiptData.deductedInterest > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-red-500">Deducted Interest:</span> <span className="font-bold text-red-600">Rs. {receiptData.deductedInterest.toLocaleString()}</span></div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? 'Current Balance:' : 'New Balance:'}</span> <span className="font-bold text-slate-800">Rs. {receiptData.balanceAfter.toLocaleString()}</span></div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
              Close
            </button>
            <button onClick={() => window.print()} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
              <Printer size={18} /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }"""

new_receipt_page = """  if (isSuccess && receiptData) {
    const successMsg = language === 'si' 
      ? (receiptData.type === 'PENDING_APPROVAL' 
        ? `රු. ${Number(receiptData.amount).toLocaleString()} ක් ලබා ගැනීමට කළමනාකරු වෙත අනුමැතිය ඉල්ලා යවන ලදී.` 
        : receiptData.type === 'CLOSE_FD'
        ? `ස්ථාවර තැන්පතුව සාර්ථකව වසා දමන ලදී. රු. ${Number(receiptData.amount).toLocaleString()} ක් ඉතුරුම් ගිණුමට බැර කරන ලදී.`
        : `රු. ${Number(receiptData.amount).toLocaleString()} ක් සාර්ථකව ගිණුමට ${action === 'DEPOSIT' ? 'තැන්පත් කරන ලදී' : 'ලබා ගන්නා ලදී'}.`)
      : (receiptData.type === 'PENDING_APPROVAL' 
        ? `Request sent to Branch Manager to withdraw Rs. ${Number(receiptData.amount).toLocaleString()} from the account.` 
        : receiptData.type === 'CLOSE_FD'
        ? `FD closed. Rs. ${Number(receiptData.amount).toLocaleString()} credited to savings account.`
        : `Rs. ${Number(receiptData.amount).toLocaleString()} has been ${action === 'DEPOSIT' ? 'deposited to' : 'withdrawn from'} the account.`);

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{receiptData.type === 'PENDING_APPROVAL' ? t('Approval Requested') : t('Transaction Successful')}</h2>
          <p className="text-slate-500 font-medium mb-8">
            {successMsg}
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? t('Request ID:') : t('Txn ID:')}</span> <span className="font-mono font-bold text-slate-700">{receiptData.transactionId}</span></div>
            {receiptData.type === 'CLOSE_FD' ? (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-500">{t('Credited Amount:')}</span> <span className="font-bold text-slate-800">Rs. {receiptData.amount.toLocaleString()}</span></div>
                {receiptData.deductedInterest > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-red-500">{t('Deducted Interest:')}</span> <span className="font-bold text-red-600">Rs. {receiptData.deductedInterest.toLocaleString()}</span></div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? t('Current Balance:') : t('New Balance:')}</span> <span className="font-bold text-slate-800">Rs. {receiptData.balanceAfter.toLocaleString()}</span></div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
              {t('Close')}
            </button>
            <button onClick={() => window.print()} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
              <Printer size={18} /> {t('Print Receipt')}
            </button>
          </div>
        </div>
      </div>
    );
  }"""

# 5. Insert Confirmation Screen overlay inside the form column of the modal
old_form_column = """          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" /> 
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleTransaction} className="space-y-5">"""

new_form_column = """          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" /> 
                <span>{error}</span>
              </div>
            )}
            
            {showConfirm ? (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 animate-in fade-in duration-200">
                  <AlertTriangle className="shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-sm">{language === 'si' ? 'ගනුදෙනුව තහවුරු කරන්න' : 'Confirm Transaction'}</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      {language === 'si' 
                        ? 'කරුණාකර පහත විස්තර නිවැරදිදැයි පරීක්‍ෂා කර තහවුරු කරන්න. මෙම ගනුදෙනුව ආපසු හැරවිය නොහැක.' 
                        : 'Please verify the details below. Once processed, this transaction cannot be reversed.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 shadow-inner">
                  <div className="flex justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('Type')}</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {action === 'DEPOSIT' ? (language === 'si' ? 'මුදල් තැන්පතුව (DEPOSIT)' : 'DEPOSIT') : action === 'WITHDRAW' ? (language === 'si' ? 'මුදල් ලබාගැනීම (WITHDRAWAL)' : 'WITHDRAWAL') : action === 'PAY_INSTALLMENT' ? (language === 'si' ? 'ණය වාරික ගෙවීම' : 'PAY INSTALLMENT') : 'FD closure'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('Account No')}</span>
                    <span className="font-mono font-bold text-slate-800 text-base">{internalAccNo || accountNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('Account Owner')}</span>
                    <span className="font-bold text-slate-800">{currentHolder}</span>
                  </div>
                  {action !== 'CLOSE_FD' && (
                    <div className="flex justify-between border-b border-slate-200 pb-2.5">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('Amount')}</span>
                      <span className="font-black text-emerald-600 text-lg">Rs. {Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  )}
                  {reference && (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{language === 'si' ? 'ලදුපත් අංකය' : 'Reference No'}</span>
                      <span className="font-mono font-bold text-slate-700">{reference}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(false)} 
                    disabled={loading}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-all"
                  >
                    {language === 'si' ? 'නැත, සංස්කරණය කරන්න' : 'No, Edit'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleTransaction()} 
                    disabled={loading}
                    className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2 ${
                      details.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      details.color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800'
                    }`}
                  >
                    {loading ? (
                      <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5"></span>
                    ) : (
                      language === 'si' ? 'ඔව්, තහවුරු කරන්න' : 'Yes, Confirm'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTransaction} className="space-y-5">"""

# 6. We also need to add closing tags for our showConfirm conditional render!
# At the bottom of the form where </form> is used, we need to end it with a conditional close.
old_form_end = """            </form>
          </div>
        </div>"""

new_form_end = """            </form>
            )}
          </div>
        </div>"""

# Helper to apply replace with CRLF support
def apply_replace(text, old_s, new_s):
    if old_s in text:
        return text.replace(old_s, new_s, 1), True
    old_crlf = old_s.replace('\n', '\r\n')
    new_crlf = new_s.replace('\n', '\r\n')
    if old_crlf in text:
        return text.replace(old_crlf, new_crlf, 1), True
    return text, False

content, ok1 = apply_replace(content, old_imports, new_imports)
content, ok2 = apply_replace(content, old_component_start, new_component_start)
content, ok3 = apply_replace(content, old_handle_tx, new_handle_tx)
content, ok4 = apply_replace(content, old_receipt_page, new_receipt_page)
content, ok5 = apply_replace(content, old_form_column, new_form_column)
content, ok6 = apply_replace(content, old_form_end, new_form_end)

print("ok1 (imports):", ok1)
print("ok2 (component start):", ok2)
print("ok3 (handleTransaction confirmation):", ok3)
print("ok4 (receipt translations):", ok4)
print("ok5 (confirmation screen layout):", ok5)
print("ok6 (conditional close):", ok6)

with open('src/components/TransactionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("TransactionModal confirmation updates complete.")
