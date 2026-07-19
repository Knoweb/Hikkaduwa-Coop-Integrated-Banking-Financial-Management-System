import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <title>Excel Data Entry Guidelines - Savings Accounts</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+Sinhala:wght@400;700&display=swap');
        
        body {
            font-family: 'Inter', 'Noto Sans Sinhala', sans-serif;
            color: #333333;
            line-height: 1.6;
            margin: 40px;
            background-color: #ffffff;
        }
        
        h1 {
            color: #025a4e;
            font-size: 24px;
            border-bottom: 3px solid #025a4e;
            padding-bottom: 10px;
            margin-top: 0;
            text-align: center;
        }
        
        h2 {
            color: #2c3e50;
            font-size: 17px;
            margin-top: 25px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        
        p, li {
            font-size: 12.5px;
        }
        
        ul {
            padding-left: 20px;
        }
        
        li {
            margin-bottom: 6px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 25px;
            font-size: 11px;
        }
        
        th, td {
            border: 1px solid #dddddd;
            text-align: left;
            padding: 6px;
        }
        
        th {
            background-color: #f2f2f2;
            color: #333;
            font-weight: 600;
        }
        
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        
        .badge-red {
            background-color: #f1948a;
            color: #78281f;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: bold;
        }
        
        .badge-yellow {
            background-color: #f9e79f;
            color: #7d6608;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: bold;
        }
        
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>

    <h1>Excel දත්ත ඇතුලත් කිරීමේ මාර්ගෝපදේශය (ඉතුරුම් ගිණුම්)</h1>
    
    <h2>1. ඉතුරුම් ගිණුම් Excel එක පුරවන ආකාරය (Savings Template)</h2>
    <ul>
        <li><strong>පද්ධතියෙන් සෑදෙන තීරු (රතු පැහැති):</strong> <code>account_id</code> සහ <code>created_at</code> යන තීරු <strong>සම්පූර්ණයෙන්ම හිස්ව තබන්න</strong>.</li>
        <li><strong>සාමාජිකයා සම්බන්ධ කිරීම (Linking Members):</strong>
            <ul>
                <li><code>membership_number</code> තීරුවට සාමාජිකයාගේ නිවැරදි සාමාජික අංකය (උදා: <code>M-1-1001</code>) ඇතුලත් කරන්න.</li>
                <li><code>member_nic</code> තීරුවට සාමාජිකයාගේ හැඳුනුම්පත් අංකය ඇතුලත් කරන්න. (වැඩි ආරක්ෂාවට මේ දෙකම ඇතුලත් කිරීම ඉතා වැදගත් වේ).</li>
            </ul>
        </li>
        <li><strong>branch_id (ශාඛාවේ අංකය):</strong> <strong>සාමාජිකයා ලියාපදිංචි කර ඇති ශාඛාවේ අංකයම</strong> (1, 2, හෝ 3) මෙතැනට ඇතුලත් කරන්න. (උදා: සාමාජිකයා 1 වන ශාඛාවේ නම්, ගිණුමේ branch_id එකටද <code>1</code> ඇතුලත් කරන්න).</li>
        <li><strong>නව ගිණුමක් ද, පරණ (ක්‍රමයෙන් සංක්‍රමණය වූ) ගිණුමක් ද යන්න:</strong>
            <ul>
                <li><strong>අලුත් ගිණුමක් (New Account) නම්:</strong> <code>initial_deposit</code> තීරුවට ආරම්භක තැන්පතුව ඇතුලත් කර, <code>balance</code> තීරුව හිස්ව තබා, <code>opened_date</code> එකට <strong>අද දිනය</strong> ඇතුලත් කරන්න (නැතහොත් හිස්ව තැබුවහොත් ඉබේම අද දිනය වැටේ).</li>
                <li><strong>පරණ ගිණුමක් (Old Migrated Account) නම්:</strong> <code>initial_deposit</code> තීරුව <code>0</code> ලෙස හෝ හිස්ව තබා, දැනට පවතින ඉතිරිකිරීම් ශේෂය (Brought Forward balance) <code>balance</code> තීරුවට ඇතුලත් කර, <code>opened_date</code> එකට ගිණුම ආරම්භ කළ සැබෑ දිනය ඇතුලත් කරන්න.</li>
            </ul>
        </li>
        <li><strong>හවුල් ගිණුමක් (Joint Account) නම් පමණක්:</strong>
            <ul>
                <li><code>account_mode</code> තීරුවෙන් <code>joint</code> තෝරාගන්න.</li>
                <li><code>joint_membership_number_2</code> සහ <code>occupation2</code> අනිවාර්යයෙන් පුරවන්න.</li>
                <li><code>joint_membership_number_3</code> සහ <code>occupation3</code> පුරවන්න.</li>
                <li><em>තනි ගිණුමක් (Single) නම් මේ හවුල් තීරු සියල්ල හිස්ව තබන්න.</em></li>
            </ul>
        </li>
        <li><strong>ළමා ගිණුමක් (Child Account) නම් පමණක්:</strong>
            <ul>
                <li><code>account_type</code> තීරුවෙන් <code>arunalu</code> හෝ <code>ranthilina</code> තෝරාගන්න.</li>
                <li><code>child_name</code>, <code>child_birth_certificate</code>, සහ <code>child_date_of_birth</code> යන තීරු 3 ම අනිවාර්යයෙන් පුරවන්න.</li>
                <li><em>වැඩිහිටි ගිණුමක් නම් මේ ළමා තීරු 3 ම හිස්ව තබන්න.</em></li>
            </ul>
        </li>
    </ul>

    <div class="page-break"></div>

    <h2>2. ඉතුරුම් ගිණුම් Excel තීරු විස්තරය (Columns Legend)</h2>
    
    <table>
        <thead>
            <tr>
                <th style="width: 25%;">තීරුවේ නම</th>
                <th style="width: 20%;">සිංහල තේරුම</th>
                <th style="width: 20%;">දත්ත වර්ගය</th>
                <th style="width: 35%;">විශේෂ උපදෙස්</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>is_member</strong></td>
                <td>ගිණුමේ ලියාපදිංචි වර්ගය</td>
                <td>true / false</td>
                <td>සාමාජික ගිණුමක් සඳහා <strong>true</strong> ද, සාමාජික නොවන ගිණුමක් සඳහා <strong>false</strong> ද තෝරන්න.</td>
            </tr>
            <tr>
                <td><strong>account_type</strong></td>
                <td>ගිණුම් වර්ගය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>වැඩිහිටි: <code>samanaya</code>, <code>janasetha</code>, <code>dhana_yojana</code>, <code>vandana</code><br>ළමා: <code>arunalu</code>, <code>ranthilina</code></td>
            </tr>
            <tr>
                <td><strong>account_mode</strong></td>
                <td>ගිණුම් ස්වභාවය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>තනි ගිණුම් වලට <strong>single</strong> | හවුල් ගිණුම් වලට <strong>joint</strong>.</td>
            </tr>
            <tr>
                <td><strong>mode_of_operation</strong></td>
                <td>මුදල් ලබාගන්නා කොන්දේසි</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>තනි ගිණුමකට <code>self</code> ද, හවුල් ගිණුමකදී අත්සන් තබන ආකාරය අනුව <code>any_one</code>, <code>all_joint</code>, <code>joint_three</code> ද තෝරන්න.</td>
            </tr>
            <tr>
                <td><strong>account_number</strong></td>
                <td>ගිණුම් අංකය</td>
                <td>පෙළ (Text)</td>
                <td>පද්ධතියට ලබාදෙන ගිණුම් අංකය (උදා: <code>ACC-0001</code>).</td>
            </tr>
            <tr>
                <td><strong>opened_date</strong></td>
                <td>ගිණුම විවෘත කළ දිනය</td>
                <td>දිනය (YYYY-MM-DD)</td>
                <td>අලුත් ගිණුම් වලට <strong>අද දිනය</strong> (නැතහොත් හිස්ව තබන්න) | පරණ ගිණුම් වලට <strong>ආරම්භ කළ සැබෑ දිනය</strong>.</td>
            </tr>
            <tr>
                <td><strong>initial_deposit</strong></td>
                <td>ආරම්භක තැන්පතුව</td>
                <td>මුදල (Number)</td>
                <td><strong>අලුත් ගිණුම් සඳහා පමණි</strong>. පරණ ගිණුම් වලදී හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>balance</strong></td>
                <td>දැනට පවතින ශේෂය</td>
                <td>මුදල (Number)</td>
                <td><strong>පරණ ගිණුම් සඳහා පමණි</strong> (Brought Forward balance). අලුත් ගිණුම් වලදී හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>membership_number</strong></td>
                <td>සාමාජික අංකය</td>
                <td>පෙළ (Text)</td>
                <td>ගිණුම්හිමියාගේ (ළමා ගිණුමකදී නම් භාරකරුගේ) සාමාජික අංකය.</td>
            </tr>
            <tr>
                <td><strong>member_nic</strong></td>
                <td>සාමාජිකයාගේ NIC</td>
                <td>පෙළ (Text)</td>
                <td>ගිණුම්හිමියාගේ/භාරකරුගේ හැඳුනුම්පත් අංකය.</td>
            </tr>
            <tr>
                <td><strong>joint_membership_number_2</strong></td>
                <td>2 වන හවුල්කරුගේ සාමාජික අංකය</td>
                <td>පෙළ (Text)</td>
                <td><span class="badge-yellow">හවුල් ගිණුම් වලට පමණි</span>. තනි ගිණුමකදී සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>joint_membership_number_3</strong></td>
                <td>3 වන හවුල්කරුගේ සාමාජික අංකය</td>
                <td>පෙළ (Text)</td>
                <td><span class="badge-yellow">හවුල් ගිණුම් වලට පමණි</span>. තනි ගිණුමකදී සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>occupation1</strong></td>
                <td>1 වන සාමාජිකයාගේ රැකියාව</td>
                <td>පෙළ (Text)</td>
                <td>ප්‍රධාන සාමාජිකයාගේ රැකියාව (ළමා ගිණුමකදී <code>Student</code> හෝ <code>ඉගෙනුම ලබයි</code>).</td>
            </tr>
            <tr>
                <td><strong>occupation2</strong></td>
                <td>2 වන සාමාජිකයාගේ රැකියාව</td>
                <td>පෙළ (Text)</td>
                <td><span class="badge-yellow">හවුල් ගිණුම් වලට පමණි</span>. තනි ගිණුමකදී සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>occupation3</strong></td>
                <td>3 වන සාමාජිකයාගේ රැකියාව</td>
                <td>පෙළ (Text)</td>
                <td><span class="badge-yellow">හවුල් ගිණුම් වලට පමණි</span>. තනි ගිණුමකදී සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>witness_name</strong></td>
                <td>සාක්ෂිකරුගේ නම</td>
                <td>පෙළ (Text)</td>
                <td>සාක්ෂිකරුගේ නම ඇතුලත් කරන්න.</td>
            </tr>
            <tr>
                <td><strong>witness_address</strong></td>
                <td>සාක්ෂිකරුගේ ලිපිනය</td>
                <td>පෙළ (Text)</td>
                <td>සාක්ෂිකරුගේ ලිපිනය ඇතුලත් කරන්න.</td>
            </tr>
            <tr>
                <td><strong>child_name</strong></td>
                <td>දරුවාගේ නම</td>
                <td>පෙළ (Text)</td>
                <td><span class="badge-yellow">ළමා ගිණුම් වලට පමණි</span>. වැඩිහිටි ගිණුම් වලදී සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>child_birth_certificate</strong></td>
                <td>උප්පැන්න සහතික අංකය</td>
                <td>පෙළ (Text)</td>
                <td><span class="badge-yellow">ළමා ගිණුම් වලට පමණි</span>. වැඩිහිටි ගිණුම් වලදී සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>child_date_of_birth</strong></td>
                <td>දරුවාගේ උපන්දිනය</td>
                <td>දිනය (YYYY-MM-DD)</td>
                <td><span class="badge-yellow">ළමා ගිණුම් වලට පමණි</span>. වැඩිහිටි ගිණුම් වලදී සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>tenant_id</strong></td>
                <td>Tenant ID</td>
                <td>අංකයක් (Number)</td>
                <td>සියලුම පේළි සඳහා <code>1</code> ලෙස ඇතුලත් කරන්න.</td>
            </tr>
            <tr>
                <td><strong>branch_id</strong></td>
                <td>ශාඛාවේ අංකය</td>
                <td>අංකයක් (Number)</td>
                <td>සාමාජිකයා ලියාපදිංචි වී ඇති ශාඛාවේ අංකයම (<code>1</code>, <code>2</code> හෝ <code>3</code>).</td>
            </tr>
            <tr>
                <td><strong>status</strong></td>
                <td>ගිණුමේ තත්වය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>සියලුම ගිණුම් සඳහා <code>ACTIVE</code> තෝරන්න.</td>
            </tr>
            <tr>
                <td><strong>account_id</strong></td>
                <td>ගිණුමේ පද්ධති ID (UUID)</td>
                <td>පෙළ (UUID)</td>
                <td><span class="badge-red">DO NOT FILL</span> - සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>created_at</strong></td>
                <td>පද්ධතියට එක් කළ වෙලාව</td>
                <td>Timestamp</td>
                <td><span class="badge-red">DO NOT FILL</span> - සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
        </tbody>
    </table>

</body>
</html>
"""

# Save html content
with open("guidelines.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML generated successfully. Compiling PDF via Edge...")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_output = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\savings_account_guidelines.pdf"
html_input = os.path.abspath("guidelines.html")

try:
    if os.path.exists(pdf_output):
        os.remove(pdf_output)
except PermissionError:
    print("\n[ERROR] The PDF file 'savings_account_guidelines.pdf' is currently open in your browser or a PDF reader. Please close it first and then run again!\n")
    import sys
    sys.exit(1)

command = [
    edge_path,
    "--headless",
    "--disable-gpu",
    f"--print-to-pdf={pdf_output}",
    "--no-pdf-header-footer",
    html_input
]

try:
    subprocess.run(command, check=True)
    # Remove temporary HTML file
    if os.path.exists(html_input):
        os.remove(html_input)
    print("PDF generated successfully.")
except Exception as e:
    print(f"Error compiling PDF: {e}")
