with open('src/context/LanguageContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Language type
content = content.replace("type Language = 'en' | 'si';", "type Language = 'en' | 'si' | 'ta';")

# 2. Add tamilDict definition right before LanguageContext
tamil_dict_str = """
const tamilDict: Record<string, string> = {
  "HMCS Banking": "HMCS வங்கி",
  "Secure Portal Access": "பாதுகாப்பான போர்டல் அணுகல்",
  "Username": "பயனர் பெயர்",
  "Password": "கடவுச்சொல்",
  "Sign In to Secure Portal": "உள்நுழையவும்",
  "Enter your username": "பயனர் பெயரை உள்ளிடவும்",
  "Authenticating...": "உறுதிப்படுத்தப்படுகிறது...",
  "Hikkaduwa Multi-Purpose Co-operative Society Ltd.": "ஹிக்கடுவ பல்நோக்கு கூட்டுறவு சங்கம் லிமிடெட்",
  "© 2026 INTEGRATED BANKING SYSTEM": "© 2026 ஒருங்கிணைந்த வங்கி அமைப்பு",
  "Hikkaduwa Branch": "ஹிக்கடுவ கிளை",
  "Dodanduwa Branch": "தொடந்துவ கிளை",
  "Rathgama Branch": "ரத்கம கிளை",
  "Seenigama Branch": "சீனிகம கிளை",
  "Thiranagama Branch": "திரணகம கிளை",
  "Peraliya Branch": "பெரலிய கிளை",
  "Kalupe Branch": "கலுபே கிளை",
  "Gonapinuwala Branch": "கோனாபினுவல கிளை",
  "Dodangoda Branch": "தொடாங்கொட கிளை",
  "Baddegama Main Branch": "பத்தேகம பிரதான கிளை",
  "Galle Main Branch": "காலி பிரதான கிளை",
  "සන්දරවල ශාඛාව": "சந்தரவல கிளை",
  "පැරෑලිය ශාඛාව": "பெரலிய கிளை",
  "Dashboard": "டாஷ்போர்டு",
  "Total Members": "மொத்த உறுப்பினர்கள்",
  "Active Members": "செயலில் உள்ள உறுப்பினர்கள்",
  "Total Accounts": "மொத்த கணக்குகள்",
  "Account No.": "கணக்கு எண்",
  "Type": "வகை",
  "Balance": "இருப்பு",
  "Status": "நிலை",
  "Member": "உறுப்பினர்",
  "Action": "செயல்பாடு",
  "Open Account": "கணக்கு ஆரம்பிக்கவும்",
  "Register Member": "உறுப்பினர் பதிவு",
  "Deposit Cash": "பணம் வைப்பு",
  "Withdraw Cash": "பணம் திரும்பப் பெறல்",
  "Welcome back": "மீண்டும் வருக",
  "Sign Out": "வெளியேறவும்",
  "Branch Online": "கிளை ஆன்லைன்",
  "Reference ID": "குறிப்பு ஐடி",
  "Amount": "தொகை",
  "Balance After": "இருப்பு பின்",
  "Account Owner": "கணக்கு உரிமையாளர்",
  "Branch": "கிளை",
  "Timestamp": "நேரம்",
  "Close": "மூடவும்",
  "Deposit": "வைப்பு",
  "Withdrawal": "திரும்பப் பெறல்",
  "DEPOSIT": "வைப்பு",
  "WITHDRAWAL": "திரும்பப் பெறல்",
  "NEW_SAVINGS": "புதிய சேமிப்புக் கணக்கு",
  "NEW_FD": "புதிய நிலையான வைப்பு",
  "Activity Details": "நடவடிக்கை விவரங்கள்",
  "Confirm Transaction": "பரிவர்த்தனையை உறுதிப்படுத்தவும்",
  "Confirm": "உறுதிப்படுத்தவும்",
  "Cancel": "ரத்துசெய்",
  "Next": "அடுத்தது",
  "OPENED DATE": "ஆரம்பிக்கப்பட்ட தேதி",
  "Opened Date": "ஆரம்பிக்கப்பட்ட தேதி",
  "Maturity Date": "முதிர்வு தேதி",
  "Interest Rate": "வட்டி விகிதம்",
  "Principal Amount": "அசல் தொகை",
  "FD Number": "நிலைய வைப்பு எண்",
  "FD No": "நிலைய வைப்பு எண்",
  "Category": "வகை",
  "Term": "காலם",
  "Account Type": "கணக்கு வகை",
  "Individual": "தனி நபர்",
  "Joint": "கூட்டுக் கணக்கு",
  "Search Member": "உறுப்பினரைத் தேடு",
  "ගිණුම පවතින ශාඛාව": "கணக்கு இருக்கும் கிளை",
  "සමන්ත සෙනෙෂ්": "சமந்த செனேஷ்"
};
"""

content = content.replace("interface LanguageContextType {", tamil_dict_str + "\ninterface LanguageContextType {")

# 3. Update the t function to support tamilDict lookup
old_t_fn = """  const t = (key: string): string => {
    if (!translations[key]) {
      return key; // Fallback
    }
    return translations[key][language];
  };"""

new_t_fn = """  const t = (key: string): string => {
    if (language === 'ta' && tamilDict[key]) {
      return tamilDict[key];
    }
    if (!translations[key]) {
      return key; // Fallback
    }
    return (translations[key] as any)[language] || translations[key]['en'] || key;
  };"""

if old_t_fn in content:
    content = content.replace(old_t_fn, new_t_fn)
else:
    # try CRLF version
    old_t_fn_crlf = old_t_fn.replace('\n', '\r\n')
    new_t_fn_crlf = new_t_fn.replace('\n', '\r\n')
    content = content.replace(old_t_fn_crlf, new_t_fn_crlf)

with open('src/context/LanguageContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Tamil translations dictionary added successfully.")
