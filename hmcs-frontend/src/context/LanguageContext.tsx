import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type Language = 'en' | 'si';

interface Translations {
  [key: string]: { en: string; si: string };
}

const translations: Translations = {
  // Login
  'HMCS Banking': { en: 'HMCS Banking', si: 'HMCS බැංකුව' },
  'Secure Portal Access': { en: 'Secure Portal Access', si: 'සුරක්ෂිත පිවිසුම' },
  'Username': { en: 'Username', si: 'පරිශීලක නාමය' },
  'Password': { en: 'Password', si: 'මුරපදය' },
  'Sign In to Secure Portal': { en: 'Sign In to Secure Portal', si: 'පද්ධතියට ඇතුළු වන්න' },
  'Enter your username': { en: 'Enter your username', si: 'පරිශීලක නාමය ඇතුළත් කරන්න' },
  'Authenticating...': { en: 'Authenticating...', si: 'තහවුරු කරමින්...' },
  'Hikkaduwa Multi-Purpose Co-operative Society Ltd.': { en: 'Hikkaduwa Multi-Purpose Co-operative Society Ltd.', si: 'හික්කඩුව විවිධ සේවා සමුපකාර සමිතිය' },
  '© 2026 INTEGRATED BANKING SYSTEM': { en: '© 2026 INTEGRATED BANKING SYSTEM', si: '© 2026 ඒකාබද්ධ බැංකු පද්ධතිය' },

  // Branches
  'Hikkaduwa Branch': { en: 'Hikkaduwa Branch', si: 'හික්කඩුව ශාඛාව' },
  'Dodanduwa Branch': { en: 'Dodanduwa Branch', si: 'දොඩන්දූව ශාඛාව' },
  'Rathgama Branch': { en: 'Rathgama Branch', si: 'රත්ගම ශාඛාව' },
  'Seenigama Branch': { en: 'Seenigama Branch', si: 'සීනිගම ශාඛාව' },
  'Thiranagama Branch': { en: 'Thiranagama Branch', si: 'තිරණගම ශාඛාව' },
  'Peraliya Branch': { en: 'Peraliya Branch', si: 'පෙරලිය ශාඛාව' },
  'Kalupe Branch': { en: 'Kalupe Branch', si: 'කලුපේ ශාඛාව' },
  'Gonapinuwala Branch': { en: 'Gonapinuwala Branch', si: 'ගෝනාපීනුවල ශාඛාව' },

  // Common
  'Dashboard': { en: 'Dashboard', si: 'පාලක පුවරුව' },
  'Branch Online': { en: 'Branch Online', si: 'ශාඛාව මාර්ගගතයි' },
  'Welcome back': { en: 'Welcome back', si: 'නැවත සාදරයෙන් පිළිගනිමු' },
  'Here\'s your work summary.': { en: 'Here\'s your work summary.', si: 'මෙන්න ඔබගේ වැඩ සාරාංශය.' },
  'Sign Out': { en: 'Sign Out', si: 'ඉවත් වන්න' },
  'Cancel': { en: 'Cancel', si: 'අවලංගු කරන්න' },
  'Processing...': { en: 'Processing...', si: 'සැකසෙමින් පවතී...' },
  'Search by name or NIC...': { en: 'Search by name or NIC...', si: 'නම හෝ හැඳුනුම්පත මගින් සොයන්න...' },
  'Search account number...': { en: 'Search account number...', si: 'ගිණුම් අංකය සොයන්න...' },

  // Sidebar labels
  'Overview': { en: 'Overview', si: 'දළ විශ්ලේෂණය' },
  'Members': { en: 'Members', si: 'සාමාජිකයින්' },
  'Savings Accounts': { en: 'Savings Accounts', si: 'ඉතුරුම් ගිණුම්' },
  'Fixed Deposits': { en: 'Fixed Deposits', si: 'ස්ථාවර තැන්පතු' },
  'Loan Accounts': { en: 'Loan Accounts', si: 'ණය ගිණුම්' },
  'Pawning (Gold Loans)': { en: 'Pawning (Gold Loans)', si: 'උකස් (රන් ණය)' },
  'Loan Queue': { en: 'Loan Queue', si: 'ණය පෝලිම' },
  'Loan Committee Approved': { en: 'Loan Committee Approved', si: 'කමිටුව අනුමත කළ ණය' },
  'Manager Approved': { en: 'Manager Approved', si: 'කළමනාකරු අනුමත කළ' },
  'Loan Committee Approval': { en: 'Loan Committee Approval', si: 'ණය කමිටු අනුමැතිය' },
  'Committee Approved': { en: 'Committee Approved', si: 'කමිටුව අනුමත කළ' },
  'All Loans': { en: 'All Loans', si: 'සියලුම ණය' },
  'Alerts': { en: 'Alerts', si: 'ඇඟවීම්' },
  
  // Dashboard Titles & Stats
  'Total Members': { en: 'Total Members', si: 'මුළු සාමාජිකයින්' },
  'Active Members': { en: 'Active Members', si: 'ක්‍රියාකාරී සාමාජිකයින්' },
  'Total Accounts': { en: 'Total Accounts', si: 'මුළු ගිණුම්' },
  'Branch Members': { en: 'Branch Members', si: 'ශාඛා සාමාජිකයින්' },
  'Branch Accounts': { en: 'Branch Accounts', si: 'ශාඛා ගිණුම්' },
  
  // Tables
  'Account No.': { en: 'Account No.', si: 'ගිණුම් අංකය' },
  'Type': { en: 'Type', si: 'වර්ගය' },
  'Balance': { en: 'Balance', si: 'ශේෂය' },
  'Status': { en: 'Status', si: 'තත්ත්වය' },
  'Member': { en: 'Member', si: 'සාමාජිකයා' },
  'Membership No': { en: 'Membership No', si: 'සාමාජික අංකය' },
  'NIC': { en: 'NIC', si: 'හැඳුනුම්පත' },
  'Accounts': { en: 'Accounts', si: 'ගිණුම්' },
  'Action': { en: 'Action', si: 'ක්‍රියාව' },
  'No members found. Register the first member!': { en: 'No members found. Register the first member!', si: 'සාමාජිකයින් හමු නොවීය. පළමු සාමාජිකයා ලියාපදිංචි කරන්න!' },
  'No accounts found': { en: 'No accounts found', si: 'ගිණුම් කිසිවක් හමු නොවීය' },
  
  // Buttons
  'Open Account': { en: 'Open Account', si: 'ගිණුමක් විවෘත කරන්න' },
  'Register Member': { en: 'Register Member', si: 'සාමාජිකයෙකු ලියාපදිංචි කරන්න' },
  'Opening...': { en: 'Opening...', si: 'විවෘත කරමින්...' },
  
  // Register Member Form
  'Register New Member': { en: 'Register New Member', si: 'නව සාමාජිකයෙකු ලියාපදිංචි කරන්න' },
  'Identification Details': { en: 'Identification Details / හැඳුනුම් තොරතුරු', si: 'Identification Details / හැඳුනුම් තොරතුරු' },
  'IDENTIFICATION DETAILS': { en: 'IDENTIFICATION DETAILS / හැඳුනුම් තොරතුරු', si: 'IDENTIFICATION DETAILS / හැඳුනුම් තොරතුරු' },
  'Age Category': { en: 'Age Category / වයස් කාණ්ඩය', si: 'Age Category / වයස් කාණ්ඩය' },
  'Adult (18+)': { en: 'Adult (18+) / වැඩිහිටි (18+)', si: 'Adult (18+) / වැඩිහිටි (18+)' },
  'Child (Under 18)': { en: 'Child (Under 18) / ළමා (18 ට අඩු)', si: 'Child (Under 18) / ළමා (18 ට අඩු)' },
  'Client ID': { en: 'Client ID / සේවාදායක අංකය', si: 'Client ID / සේවාදායක අංකය' },
  'National Identity Card (NIC)': { en: 'National Identity Card (NIC) / ජාතික හැඳුනුම්පත', si: 'National Identity Card (NIC) / ජාතික හැඳුනුම්පත' },
  'Guardian NIC': { en: 'Guardian NIC / භාරකරුගේ හැඳුනුම්පත', si: 'Guardian NIC / භාරකරුගේ හැඳුනුම්පත' },
  'Guardian ID': { en: 'Guardian ID / භාරකරුගේ අංකය', si: 'Guardian ID / භාරකරුගේ අංකය' },
  'Personal Information': { en: 'Personal Information / පුද්ගලික තොරතුරු', si: 'Personal Information / පුද්ගලික තොරතුරු' },
  'Full Name': { en: 'Full Name / සම්පූර්ණ නම', si: 'Full Name / සම්පූර්ණ නම' },
  'Full Name (English)': { en: 'Full Name (English) / සම්පූර්ණ නම (ඉංග්‍රීසි)', si: 'Full Name (English) / සම්පූර්ණ නම (ඉංග්‍රීසි)' },
  'Full Name (Sinhala/Tamil)': { en: 'Full Name (Sinhala/Tamil) / සම්පූර්ණ නම (සිංහල/දෙමළ)', si: 'Full Name (Sinhala/Tamil) / සම්පූර්ණ නම (සිංහල/දෙමළ)' },
  'Name with Initials': { en: 'Name with Initials / මුලකුරු සමඟ නම', si: 'Name with Initials / මුලකුරු සමඟ නම' },
  'Name in Sinhala (Optional)': { en: 'Name in Sinhala (Optional) / සිංහලෙන් නම (විකල්ප)', si: 'Name in Sinhala (Optional) / සිංහලෙන් නම (විකල්ප)' },
  'Date of Birth': { en: 'Date of Birth / උපන් දිනය', si: 'Date of Birth / උපන් දිනය' },
  'Gender': { en: 'Gender / ස්ත්‍රී පුරුෂ භාවය', si: 'Gender / ස්ත්‍රී පුරුෂ භාවය' },
  'Male': { en: 'Male / පුරුෂ', si: 'Male / පුරුෂ' },
  'Female': { en: 'Female / ස්ත්‍රී', si: 'Female / ස්ත්‍රී' },
  'Marital Status': { en: 'Marital Status / විවාහක/අවිවාහක බව', si: 'Marital Status / විවාහක/අවිවාහක බව' },
  'Married': { en: 'Married / විවාහක', si: 'Married / විවාහක' },
  'Unmarried': { en: 'Unmarried / අවිවාහක', si: 'Unmarried / අවිවාහක' },
  'Address': { en: 'Address / ලිපිනය', si: 'Address / ලිපිනය' },
  'Province': { en: 'Province / පළාත', si: 'Province / පළාත' },
  'Contact Number': { en: 'Contact Number / දුරකථන අංකය', si: 'Contact Number / දුරකථන අංකය' },
  'Photograph': { en: 'Photograph / ඡායාරූපය', si: 'Photograph / ඡායාරූපය' },
  'Digital Documents': { en: 'Digital Documents / ඩිජිටල් ලිපිලේඛන', si: 'Digital Documents / ඩිජිටල් ලිපිලේඛන' },
  'Registration Type': { en: 'Registration Type / ලියාපදිංචි වර්ගය', si: 'Registration Type / ලියාපදිංචි වර්ගය' },
  'Society Member': { en: 'Society Member', si: 'සමිතියේ සාමාජික' },
  'Non-Member': { en: 'Non-Member', si: 'සාමාජික නොවන' },
  'Select Person': { en: 'Select Person', si: 'පුද්ගලයා තෝරන්න' },
  'Membership Details': { en: 'Membership Details', si: 'සාමාජිකත්ව තොරතුරු' },
  // Account Types
  'Normal Savings (Samanaya 01)': { en: 'Normal (Samanaya 01) / සාමාන්‍ය 01', si: 'Normal (Samanaya 01) / සාමාන්‍ය 01' },
  'NORMAL': { en: 'Normal (Samanaya 01) / සාමාන්‍ය 01', si: 'Normal (Samanaya 01) / සාමාන්‍ය 01' },
  'Janasetha': { en: 'Janasetha / ජනසෙත', si: 'Janasetha / ජනසෙත' },
  'JANASETHA': { en: 'Janasetha / ජනසෙත', si: 'Janasetha / ජනසෙත' },
  'Dhana Yojana': { en: 'Dhana Yojana / ධන යෝජනා', si: 'Dhana Yojana / ධන යෝජනා' },
  'DHANA_YOJANA': { en: 'Dhana Yojana / ධන යෝජනා', si: 'Dhana Yojana / ධන යෝජනා' },
  'Vandana': { en: 'Vandana / වන්දනා', si: 'Vandana / වන්දනා' },
  'VANDANA': { en: 'Vandana / වන්දනා', si: 'Vandana / වන්දනා' },
  'Arunalu (Children)': { en: 'Arunalu / අරුණලු', si: 'Arunalu / අරුණලු' },
  'ARUNALU': { en: 'Arunalu / අරුණලු', si: 'Arunalu / අරුණලු' },
  'Ranthilina (Children)': { en: 'Ranthilina / රන්තිලින', si: 'Ranthilina / රන්තිලින' },
  'RANTHILINA': { en: 'Ranthilina / රන්තිලින', si: 'Ranthilina / රන්තිලින' },
  'Non-Members': { en: 'Non-Members', si: 'සාමාජික නොවන අය' },
  'Total Non-Members': { en: 'Total Non-Members', si: 'මුළු සාමාජික නොවන අය' },
  'Active Non-Members': { en: 'Active Non-Members', si: 'සක්‍රිය සාමාජික නොවන අය' },
  'Register Non-Member': { en: 'Register Non-Member', si: 'සාමාජික නොවන අය ලියාපදිංචි කරන්න' },
  'Share Amount (Rs.)': { en: 'Share Capital (Rs.)', si: 'කොටස් අරමුදල (රු.)' },
  'Number of Shares': { en: 'Number of Shares', si: 'මිලදී ගත් කොටස් ප්‍රමාණය' },
  'Belongs to another society?': { en: 'Belongs to another society?', si: 'වෙනත් සමිතියකට අයත්ද?' },
  'Other Society Name': { en: 'Other Society Name', si: 'වෙනත් සමිතියේ නම' },
  'Authorize & Register': { en: 'Authorize & Register', si: 'අනුමත කර ලියාපදිංචි කරන්න' },

  // Open Account Form
  'Open Savings Account': { en: 'Open Savings Account', si: 'ඉතුරුම් ගිණුමක් විවෘත කරන්න' },
  'Select Member': { en: 'Select Member', si: 'සාමාජිකයා තෝරන්න' },
  '-- Select Member --': { en: '-- Select Member --', si: '-- සාමාජිකයා තෝරන්න --' },
  'Members (Samajika)': { en: 'Members (Samajika)', si: 'සාමාජිකයින් (සාමාජික)' },
  'Non-Members (Customers)': { en: 'Non-Members (Customers)', si: 'සාමාජික නොවන (පාරිභෝගිකයින්)' },
  'Account Type': { en: 'Account Type', si: 'ගිණුම් වර්ගය' },
  'Regular Savings': { en: 'Regular Savings', si: 'සාමාන්‍ය ඉතුරුම්' },
  "Children's Account": { en: "Children's Account", si: 'ළමා ගිණුම' },
  'Senior Citizen': { en: 'Senior Citizen', si: 'ජ්‍යෙෂ්ඨ පුරවැසි' },
  'Fixed Deposit': { en: 'Fixed Deposit', si: 'ස්ථාවර තැන්පතුව' },
  'Initial Deposit (Rs.)': { en: 'Initial Deposit (Rs.)', si: 'මූලික තැන්පතුව (රු.)' },
  'Child Information': { en: 'Child Information', si: 'ළමා තොරතුරු' },
  "Child's Name *": { en: "Child's Name *", si: 'ළමයාගේ නම *' },
  'Birth Certificate No. *': { en: 'Birth Certificate No. *', si: 'උප්පැන්න සහතික අංකය *' },
  'Date of Birth *': { en: 'Date of Birth *', si: 'උපන් දිනය *' },

  // Values
  'REGULAR': { en: 'REGULAR', si: 'සාමාන්‍ය' },
  'CHILD': { en: 'CHILD', si: 'ළමා' },
  'SENIOR': { en: 'SENIOR', si: 'ජ්‍යෙෂ්ඨ' },
  'FIXED': { en: 'FIXED', si: 'ස්ථාවර' },
  'ACTIVE': { en: 'ACTIVE', si: 'ක්‍රියාකාරී' },
  'PENDING': { en: 'PENDING', si: 'පොරොත්තු' },
  
  // Roles
  'Senior Officer': { en: 'Senior Officer', si: 'ජ්‍යෙෂ්ඨ නිලධාරී' },
  'Branch Manager': { en: 'Branch Manager', si: 'ශාඛා කළමනාකරු' },
  'Bank Service Manager': { en: 'Bank Service Manager', si: 'බැංකු සේවා කළමනාකරු' },
  'Teller': { en: 'Teller', si: 'මුදල් අයකැමි' },
  
  // Admin Dashboard
  'System Administration Panel': { en: 'System Administration Panel', si: 'පද්ධති පරිපාලන පුවරුව' },
  'HMCS Integrated Banking System · All 8 Branches': { en: 'HMCS Integrated Banking System · All 8 Branches', si: 'HMCS ඒකාබද්ධ බැංකු පද්ධතිය · ශාඛා 8ම' },
  '8 / 8 Branches Online': { en: '8 / 8 Branches Online', si: 'ශාඛා 8/8 මාර්ගගතයි' },
  'Total System Users': { en: 'Total System Users', si: 'මුළු පද්ධති පරිශීලකයින්' },
  'Across all branches': { en: 'Across all branches', si: 'සියලුම ශාඛා හරහා' },
  'Active Branches': { en: 'Active Branches', si: 'ක්‍රියාකාරී ශාඛා' },
  'All online': { en: 'All online', si: 'සියල්ල මාර්ගගතයි' },
  'System Uptime': { en: 'System Uptime', si: 'පද්ධති ක්‍රියාකාරී කාලය' },
  'Last 45 days': { en: 'Last 45 days', si: 'පසුගිය දින 45' },
  'Daily Backup': { en: 'Daily Backup', si: 'දෛනික උපස්ථය' },
  'Today 02:00 AM': { en: 'Today 02:00 AM', si: 'අද පෙ.ව 02:00' },
  'HMCS Bank': { en: 'HMCS Bank', si: 'HMCS බැංකුව' },
  'System Administration': { en: 'System Administration', si: 'පද්ධති පරිපාලනය' },
  'Live Branch Network — Click to Manage': { en: 'Live Branch Network — Click to Manage', si: 'සජීවී ශාඛා ජාලය — කළමනාකරණය කිරීමට ක්ලික් කරන්න' },
  'Online': { en: 'Online', si: 'මාර්ගගතයි' },
  'user': { en: 'user', si: 'පරිශීලකයෙක්' },
  'users': { en: 'users', si: 'පරිශීලකයින්' },
  'System Activity Log': { en: 'System Activity Log', si: 'පද්ධති ක්‍රියාකාරකම් ලොගය' },
  
  // Branch Detail view
  'staff accounts': { en: 'staff accounts', si: 'කාර්ය මණ්ඩල ගිණුම්' },
  'Staff & Users': { en: 'Staff & Users', si: 'කාර්ය මණ්ඩලය සහ පරිශීලකයින්' },
  'Interest Rates': { en: 'Interest Rates', si: 'පොලී අනුපාත' },
  'Account Types': { en: 'Account Types', si: 'ගිණුම් වර්ග' },
  'Add Type': { en: 'Add Type', si: 'අලුතින් එක් කරන්න' },
  'Branch Config': { en: 'Branch Config', si: 'ශාඛා සැකසුම්' },
  'Add User': { en: 'Add User', si: 'පරිශීලක එක් කරන්න' },
  'Role': { en: 'Role', si: 'භූමිකාව' },
  'Actions': { en: 'Actions', si: 'ක්‍රියා' },
  'Edit': { en: 'Edit', si: 'සංස්කරණය' },
  'Delete': { en: 'Delete', si: 'මකන්න' },
  'Active': { en: 'Active', si: 'ක්‍රියාකාරී' },
  'Save Changes': { en: 'Save Changes', si: 'වෙනස්කම් සුරකින්න' },
  'Create User': { en: 'Create User', si: 'පරිශීලක සාදන්න' },
  'Branch Interest & Loan Rates': { en: 'Branch Interest & Loan Rates', si: 'ශාඛා පොලී සහ ණය අනුපාත' },
  'FD Interest Rate (%)': { en: 'FD Interest Rate (%)', si: 'ස්ථාවර තැන්පතු පොලී අනුපාතය (%)' },
  'FD Bonus Rate (%)': { en: 'FD Bonus Rate (%)', si: 'ස්ථාවර තැන්පතු ප්‍රසාද අනුපාතය (%)' },
  'Pawning Rate (% p.a.)': { en: 'Pawning Rate (% p.a.)', si: 'උකස් අනුපාතය (වාර්ෂික %)' },
  'Max Loan Term (Months)': { en: 'Max Loan Term (Months)', si: 'උපරිම ණය කාලය (මාස)' },
  'Save Rates': { en: 'Save Rates', si: 'අනුපාත සුරකින්න' },
  'Add Savings Type': { en: 'Add Savings Type', si: 'ඉතුරුම් වර්ගය එක් කරන්න' },
  'Code': { en: 'Code', si: 'කේතය' },
  'Account Target': { en: 'Account Target', si: 'ගිණුම් ඉලක්කය' },
  'English Name': { en: 'English Name', si: 'ඉංග්‍රීසි නම' },
  'Sinhala Name': { en: 'Sinhala Name', si: 'සිංහල නම' },
  'Adult': { en: 'Adult', si: 'වැඩිහිටි' },
  'Save': { en: 'Save', si: 'සුරකින්න' },
  'Manage Savings Account Types': { en: 'Manage Savings Account Types', si: 'ඉතුරුම් ගිණුම් වර්ග කළමනාකරණය' },
  'Target': { en: 'Target', si: 'ඉලක්කය' },
  'English': { en: 'English', si: 'ඉංග්‍රීසි' },
  'Sinhala': { en: 'Sinhala', si: 'සිංහල' },
  'Branch Information': { en: 'Branch Information', si: 'ශාඛා තොරතුරු' },
  'Branch Name': { en: 'Branch Name', si: 'ශාඛාවේ නම' },
  'Location': { en: 'Location', si: 'ස්ථානය' },
  'Branch Status': { en: 'Branch Status', si: 'ශාඛා තත්ත්වය' },
  'Mark branch as Active / Inactive': { en: 'Mark branch as Active / Inactive', si: 'ශාඛාව ක්‍රියාකාරී / අක්‍රිය ලෙස ලකුණු කරන්න' },
  'Inactive branches cannot process transactions.': { en: 'Inactive branches cannot process transactions.', si: 'අක්‍රිය ශාඛාවන්ට ගනුදෙනු සිදු කළ නොහැක.' },
  'Save Config': { en: 'Save Config', si: 'සැකසුම් සුරකින්න' },
  'Edit User Profile': { en: 'Edit User Profile', si: 'පරිශීලක පැතිකඩ සංස්කරණය' },
  'New User —': { en: 'New User —', si: 'නව පරිශීලක —' },
  'Temporary Password': { en: 'Temporary Password', si: 'තාවකාලික මුරපදය' },
  'New Password (leave blank to keep)': { en: 'New Password (leave blank to keep)', si: 'නව මුරපදය (තබා ගැනීමට හිස්ව තබන්න)' },
  'Leave empty to keep existing': { en: 'Leave empty to keep existing', si: 'පවතින එක තබා ගැනීමට හිස්ව තබන්න' },
  'Set password': { en: 'Set password', si: 'මුරපදය සකසන්න' },
  'No staff accounts yet.': { en: 'No staff accounts yet.', si: 'තවමත් කාර්ය මණ්ඩල ගිණුම් නොමැත.' },
  'Click "Add User" to create the first account for this branch.': { en: 'Click "Add User" to create the first account for this branch.', si: 'මෙම ශාඛාව සඳහා පළමු ගිණුම සෑදීමට "පරිශීලක එක් කරන්න" ක්ලික් කරන්න.' },

  // Rates Categories
  'Savings': { en: 'Savings', si: 'ඉතුරුම්' },
  'Loans': { en: 'Loans', si: 'ණය' },
  'Pawning': { en: 'Pawning', si: 'උකස්' },
  'General / Shares': { en: 'General / Shares', si: 'සාමාන්‍ය / කොටස්' },
  'Total Earnings': { en: 'Total Earnings', si: 'මුළු ඉපැයීම්' },
  'Product / Type': { en: 'Product / Type', si: 'නිෂ්පාදනය / වර්ගය' },
  'Interest Rate / Value': { en: 'Interest Rate / Value', si: 'පොලී අනුපාතය / අගය' },
  'All': { en: 'All', si: 'සියල්ල' },
  'Rs.': { en: 'Rs.', si: 'රු.' },
  'Savings Interest Rates (% p.a.)': { en: 'Savings Interest Rates (% p.a.)', si: 'ඉතුරුම් පොලී අනුපාත (වාර්ෂික %)' },
  'No savings account types found.': { en: 'No savings account types found.', si: 'ඉතුරුම් ගිණුම් වර්ග කිසිවක් හමු නොවීය.' },
  'Fixed Deposit Rates (% p.a.)': { en: 'Fixed Deposit Rates (% p.a.)', si: 'ස්ථාවර තැන්පතු අනුපාත (වාර්ෂික %)' },
  '3 Months': { en: '3 Months', si: 'මාස 3' },
  '6 Months': { en: '6 Months', si: 'මාස 6' },
  '1 Year': { en: '1 Year', si: 'අවුරුදු 1' },
  'Senior Citizen (1 Year)': { en: 'Senior Citizen (1 Year)', si: 'ජ්‍යෙෂ්ඨ පුරවැසි (අවුරුදු 1)' },
  'Loan Rates (% p.a.)': { en: 'Loan Rates (% p.a.)', si: 'ණය පොලී අනුපාත (වාර්ෂික %)' },
  'Personal Loan': { en: 'Personal Loan', si: 'පුද්ගලික ණය' },
  'Housing Loan': { en: 'Housing Loan', si: 'නිවාස ණය' },
  'Business Loan': { en: 'Business Loan', si: 'ව්‍යාපාරික ණය' },
  'Pawning Rates & Terms': { en: 'Pawning Rates & Terms', si: 'උකස් අනුපාත සහ නියමයන්' },
  'Pawning Interest Rate (% p.a.)': { en: 'Pawning Interest Rate (% p.a.)', si: 'උකස් පොලී අනුපාතය (වාර්ෂික %)' },
  'Advance per Gold Sovereign (Rs.)': { en: 'Advance per Gold Sovereign (Rs.)', si: 'රන් පවුමකට අත්තිකාරම් (රු.)' },
  'Advance per Gold Sovereign': { en: 'Advance per Gold Sovereign', si: 'රන් පවුමකට අත්තිකාරම්' },
  // Save All Rates
  'Save All Rates': { en: 'Save All Rates', si: 'සියලුම අනුපාත සුරකින්න' },
  'Branch updated successfully!': { en: 'Branch updated successfully!', si: 'ශාඛාව සාර්ථකව යාවත්කාලීන කරන ලදී!' },
  'Failed to update branch': { en: 'Failed to update branch', si: 'ශාඛාව යාවත්කාලීන කිරීම අසාර්ථකයි' },
  'Saving...': { en: 'Saving...', si: 'සුරකිමින්...' },
  
  // Locations
  'Hikkaduwa Town': { en: 'Hikkaduwa Town', si: 'හික්කඩුව නගරය' },
  'Dodanduwa': { en: 'Dodanduwa', si: 'දොඩන්දූව' },
  'Rathgama': { en: 'Rathgama', si: 'රත්ගම' },
  'Seenigama': { en: 'Seenigama', si: 'සීනිගම' },
  'Thiranagama': { en: 'Thiranagama', si: 'තිරණගම' },
  'Peraliya': { en: 'Peraliya', si: 'පේරලිය' },
  'Kalupe': { en: 'Kalupe', si: 'කළුපේ' },
  'Gonapinuwala': { en: 'Gonapinuwala', si: 'ගොනාපීනුවල' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('si'); // Default to Sinhala

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'si' : 'en'));
  };

  const t = (key: string): string => {
    if (!translations[key]) {
      return key; // Fallback
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
