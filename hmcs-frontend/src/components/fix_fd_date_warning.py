with open('src/components/OpenFixedDepositForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_imports = "import { Search, Loader2, X } from 'lucide-react';"
new_imports = "import { Search, Loader2, X, AlertTriangle } from 'lucide-react';\nimport { useLanguage } from '../context/LanguageContext';"

# 2. Inject useLanguage hook and isPastDate helper
old_fn_start = "const OpenFixedDepositForm = ({ onClose }: { onClose?: () => void }) => {\n  const [step, setStep] = useState(1);"
new_fn_start = """const OpenFixedDepositForm = ({ onClose }: { onClose?: () => void }) => {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);

  const isPastDate = (dateStr: string) => {
    if (!dateStr) return false;
    const selectedDate = new Date(dateStr);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate < today;
  };"""

# 3. Add alert under openedDate input field
old_date_input = """              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">ගිණුම ආරම්භ කළ දිනය (OPENED DATE) *</label>
                <input
                  type="date"
                  name="openedDate"
                  required
                  value={formData.openedDate}
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                />
              </div>"""

new_date_input = """              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">ගිණුම ආරම්භ කළ දිනය (OPENED DATE) *</label>
                <input
                  type="date"
                  name="openedDate"
                  required
                  value={formData.openedDate}
                  onChange={handleInputChange}
                  className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#01443b] focus:outline-none text-sm"
                />
                {formData.openedDate && isPastDate(formData.openedDate) && (
                  <div className="mt-2 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg flex items-center gap-1.5 md:w-1/2 animate-in fade-in duration-200">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>
                      {language === 'si' 
                        ? 'අතීත දිනයක් තෝරා ඇත. කරුණාකර දිනය නිවැරදි දැයි පරීක්ෂා කරන්න.' 
                        : language === 'ta'
                        ? 'கடந்த தேதி தேர்ந்தெடுக்கப்பட்டது. தேதி சரியாக இருக்கிறதா என்று பார்க்கவும்.'
                        : 'A past date is selected. Please check if the date is correct.'}
                    </span>
                  </div>
                )}
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
content, ok2 = apply_replace(content, old_fn_start, new_fn_start)
content, ok3 = apply_replace(content, old_date_input, new_date_input)

print("ok1 (imports):", ok1)
print("ok2 (fn start):", ok2)
print("ok3 (date input warning):", ok3)

with open('src/components/OpenFixedDepositForm.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed Deposit openedDate past date warning completed.")
