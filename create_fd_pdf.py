import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <title>Excel Data Entry Guidelines - Fixed Deposits</title>
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
            font-size: 10.5px;
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

    <h1>Excel දත්ත ඇතුලත් කිරීමේ මාර්ගෝපදේශය (ස්ථාවර තැන්පතු)</h1>
    
    <h2>1. ස්ථාවර තැන්පතු Excel එක පුරවන ආකාරය (Fixed Deposit Template)</h2>
    <ul>
        <li><strong>පද්ධතියෙන් සෑදෙන තීරු (රතු පැහැති):</strong> <code>fd_id</code> සහ <code>created_at</code> යන තීරු <strong>සම්පූර්ණයෙන්ම හිස්ව තබන්න</strong>.</li>
        <li><strong>සාමාජිකයා සම්බන්ධ කිරීම (Linking Members):</strong>
            <ul>
                <li><code>membership_number</code> තීරුවට සාමාජිකයාගේ නිවැරදි සාමාජික අංකය (උදා: <code>M-1-1001</code>) ඇතුලත් කරන්න.</li>
                <li><code>member_nic</code> තීරුවට සාමාජිකයාගේ හැඳුනුම්පත් අංකය ඇතුලත් කරන්න. (වැඩි ආරක්ෂාවට මේ දෙකම ඇතුලත් කිරීම ඉතා වැදගත් වේ).</li>
            </ul>
        </li>
        <li><strong>branch_id (ශාඛාවේ අංකය):</strong> <strong>සාමාජිකයා ලියාපදිංචි කර ඇති ශාඛාවේ අංකයම</strong> (1, 2, හෝ 3) මෙතැනට ඇතුලත් කරන්න. (උදා: සාමාජිකයා 1 වන ශාඛාවේ නම්, ගිණුමේ branch_id එකටද <code>1</code> ඇතුලත් කරන්න).</li>
        <li><strong>නව තැන්පතුවක් ද, පරණ (ක්‍රමයෙන් සංක්‍රමණය වූ) තැන්පතුවක් ද යන්න:</strong>
            <ul>
                <li><strong>අලුත් තැන්පතුවක් (New FD) නම්:</strong> <code>opened_date</code> එකට <strong>අද දිනය</strong> ඇතුලත් කරන්න (නැතහොත් හිස්ව තැබුවහොත් ඉබේම අද දිනය වැටේ).</li>
                <li><strong>පරණ තැන්පතුවක් (Old Migrated FD) නම්:</strong> <code>opened_date</code> එකට තැන්පතුව ආරම්භ කළ සැබෑ දිනය ඇතුලත් කරන්න. (කල් පිරෙන දිනය සහ පොලී අනුපාතය කාලය අනුව system එකෙන් ස්වයංක්‍රීයව හදා ගනී).</li>
            </ul>
        </li>
        <li><strong>සම්බන්ධිත ඉතුරුම් ගිණුම (Linked Savings Account):</strong>
            <ul>
                <li>පොළිය මාසිකව ලබාගන්නා විට (<code>interest_payout_method</code> එක <code>MONTHLY</code> නම්) හෝ කල් පිරීමේ උපදෙස <code>REINVEST_PRINCIPAL_PAY_INTEREST</code> හෝ <code>CLOSE_ACCOUNT</code> නම්, පොළිය/මුදල් බැරවීම සඳහා අදාළ සාමාජිකයාගේ <strong>ඉතුරුම් ගිණුම් අංකය</strong> (උදා: <code>ACC-0001</code>) අනිවාර්යයෙන්ම <code>linked_savings_account_number</code> තීරුවට ඇතුලත් කරන්න.</li>
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
    </ul>

    <div class="page-break"></div>

    <h2>2. ස්ථාවර තැන්පතු Excel තීරු විස්තරය (Columns Legend)</h2>
    
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
                <td><strong>fd_type_code</strong></td>
                <td>ස්ථාවර තැන්පතු වර්ගය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>Dropdown එකෙන් අදාළ වර්ගය තෝරන්න (උදා: <code>FD_NRM_1Y</code> - සාමාන්‍ය 1 වසර, <code>FD_SNR_1Y</code> - ජ්‍යෙෂ්ඨ පුරවැසි 1 වසර, <code>FD_CHD_5Y</code> - ළමා 5 වසර).</td>
            </tr>
            <tr>
                <td><strong>account_mode</strong></td>
                <td>ගිණුම් ස්වභාවය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>තනි ගිණුම් වලට <strong>single</strong> | හවුල් ගිණුම් වලට <strong>joint</strong>.</td>
            </tr>
            <tr>
                <td><strong>interest_payout_method</strong></td>
                <td>පොළිය ලබාගන්නා ක්‍රමය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>කල් පිරුණම ගැනීමට <code>AT_MATURITY</code> | මාසිකව ලබා ගැනීමට <code>MONTHLY</code>.</td>
            </tr>
            <tr>
                <td><strong>maturity_instruction</strong></td>
                <td>කල් පිරීමේ උපදෙස්</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>මුල් මුදල+පොලිය නැවත ආයෝජනයට: <code>REINVEST_PRINCIPAL_AND_INTEREST</code><br>මුල් මුදල නැවත ආයෝජනය කර පොලිය ඉතුරුම් ගිණුමට: <code>REINVEST_PRINCIPAL_PAY_INTEREST</code><br>ගිණුම වසා සියල්ල ඉතුරුම් ගිණුමට: <code>CLOSE_ACCOUNT</code></td>
            </tr>
            <tr>
                <td><strong>fd_number</strong></td>
                <td>ස්ථාවර තැන්පතු අංකය</td>
                <td>පෙළ (Text)</td>
                <td>ස්ථාවර තැන්පතු ගිණුම් අංකය ඇතුලත් කරන්න (උදා: <code>FD-00001</code>).</td>
            </tr>
            <tr>
                <td><strong>opened_date</strong></td>
                <td>තැන්පත් කළ දිනය</td>
                <td>දිනය (YYYY-MM-DD)</td>
                <td>අලුත් තැන්පතු වලට <strong>අද දිනය</strong> (හෝ හිස්ව තබන්න) | පරණ තැන්පතු වලට <strong>ආරම්භ කළ සැබෑ දිනය</strong>.</td>
            </tr>
            <tr>
                <td><strong>principal_amount</strong></td>
                <td>තැන්පත් මුදල</td>
                <td>මුදල (Number)</td>
                <td>ස්ථාවර තැන්පතු මුදල (අවම රු. 5,000 කි).</td>
            </tr>
            <tr>
                <td><strong>linked_savings_account_number</strong></td>
                <td>සම්බන්ධිත ඉතුරුම් ගිණුම</td>
                <td>පෙළ (Text)</td>
                <td>පොළිය/මුදල් බැරවිය යුතු ඉතුරුම් ගිණුම් අංකය (පොළිය මාසිකව ගන්නේ නම් හෝ කල්පිරෙද්දී මුදල් බැර වීමට නම් මෙය <span class="badge-yellow">අනිවාර්ය වේ</span>).</td>
            </tr>
            <tr>
                <td><strong>membership_number</strong></td>
                <td>සාමාජික අංකය</td>
                <td>පෙළ (Text)</td>
                <td>තැන්පත්කරුගේ (ළමා ගිණුමකදී නම් භාරකරුගේ) සාමාජික අංකය.</td>
            </tr>
            <tr>
                <td><strong>member_nic</strong></td>
                <td>සාමාජිකයාගේ NIC</td>
                <td>පෙළ (Text)</td>
                <td>තැන්පත්කරුගේ/භාරකරුගේ හැඳුනුම්පත් අංකය.</td>
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
                <td>ප්‍රධාන සාමාජිකයාගේ රැකියාව.</td>
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
                <td><strong>receipt_number</strong></td>
                <td>කුවිතාන්සි අංකය</td>
                <td>පෙළ (Text)</td>
                <td>රිසිට්පත්/කුවිතාන්සි අංකය ඇතුලත් කරන්න.</td>
            </tr>
            <tr>
                <td><strong>has_submitted_tax_form</strong></td>
                <td>බදු පෝරමය ලබාදී තිබේද?</td>
                <td>true / false</td>
                <td>බදු ආකෘති පත්‍රය ලබා දී ඇත්නම් <code>true</code> | නැතහොත් <code>false</code>.</td>
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
                <td><strong>fd_id</strong></td>
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
    </table>

    <div class="page-break"></div>

    <h2>3. ස්ථාවර තැන්පතු වර්ග සහ කේතයන් (Fixed Deposit Types & Codes)</h2>
    <p>ස්ථාවර තැන්පතු ගිණුම ආරම්භ කිරීමේදී <code>fd_type_code</code> තීරුව සඳහා පහත කේතයන්ගෙන් අදාළ එකක් තෝරාගත යුතුය. එක් එක් කේතයට අදාළ විස්තරය සහ පොලී අනුපාතයන් පහත පරිදි වේ:</p>
    <table>
        <thead>
            <tr>
                <th style="width: 25%;">කේතය (Code)</th>
                <th style="width: 45%;">තැන්පතු වර්ගය සහ කාලය (Sinhala Description)</th>
                <th style="width: 15%;">පොළිය (කල්පිරෙන විට)</th>
                <th style="width: 15%;">පොළිය (මාසිකව)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>FD_NRM_3M</strong></td>
                <td>සාමාන්‍ය ස්ථාවර තැන්පතු - මාස 3</td>
                <td>10.00%</td>
                <td>8.00%</td>
            </tr>
            <tr>
                <td><strong>FD_NRM_6M</strong></td>
                <td>සාමාන්‍ය ස්ථාවර තැන්පතු - මාස 6</td>
                <td>17.00%</td>
                <td>15.00%</td>
            </tr>
            <tr>
                <td><strong>FD_NRM_1Y</strong></td>
                <td>සාමාන්‍ය ස්ථාවර තැන්පතු - අවුරුදු 1</td>
                <td>12.00%</td>
                <td>10.00%</td>
            </tr>
            <tr>
                <td><strong>FD_NRM_24M</strong></td>
                <td>සාමාන්‍ය ස්ථාවර තැන්පතු - අවුරුදු 2</td>
                <td>15.00%</td>
                <td>13.00%</td>
            </tr>
            <tr>
                <td><strong>FD_NRM_60M</strong></td>
                <td>සාමාන්‍ය ස්ථාවර තැන්පතු - අවුරුදු 5</td>
                <td>15.00%</td>
                <td>13.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SNR_3M</strong></td>
                <td>ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - මාස 3</td>
                <td>0.00%</td>
                <td>0.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SNR_6M</strong></td>
                <td>ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - මාස 6</td>
                <td>18.00%</td>
                <td>16.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SNR_1Y</strong></td>
                <td>ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - අවුරුදු 1</td>
                <td>13.00%</td>
                <td>11.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SNR_24M</strong></td>
                <td>ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - අවුරුදු 2</td>
                <td>0.00%</td>
                <td>0.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SNR_60M</strong></td>
                <td>ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - අවුරුදු 5</td>
                <td>0.00%</td>
                <td>0.00%</td>
            </tr>
            <tr>
                <td><strong>FD_CHD_3M</strong></td>
                <td>ළමා ස්ථාවර තැන්පතු - මාස 3</td>
                <td>0.00%</td>
                <td>0.00%</td>
            </tr>
            <tr>
                <td><strong>FD_CHD_6M</strong></td>
                <td>ළමා ස්ථාවර තැන්පතු - මාස 6</td>
                <td>0.00%</td>
                <td>0.00%</td>
            </tr>
            <tr>
                <td><strong>FD_CHD_12M</strong></td>
                <td>ළමා ස්ථාවර තැන්පතු - මාස 12</td>
                <td>0.00%</td>
                <td>0.00%</td>
            </tr>
            <tr>
                <td><strong>FD_CHD_24M</strong></td>
                <td>ළමා ස්ථාවර තැන්පතු - අවුරුදු 2</td>
                <td>0.00%</td>
                <td>0.00%</td>
            </tr>
            <tr>
                <td><strong>FD_CHD_5Y</strong></td>
                <td>ළමා ස්ථාවර තැන්පතු - අවුරුදු 5</td>
                <td>14.00%</td>
                <td>12.00%</td>
            </tr>
            <tr>
                <td><strong>FD_JAY_3M</strong></td>
                <td>ජය ස්ථාවර තැන්පතු - මාස 3</td>
                <td>10.00%</td>
                <td>8.00%</td>
            </tr>
            <tr>
                <td><strong>FD_JAY_6M</strong></td>
                <td>ජය ස්ථාවර තැන්පතු - මාස 6</td>
                <td>17.00%</td>
                <td>15.00%</td>
            </tr>
            <tr>
                <td><strong>FD_JAY_1Y</strong></td>
                <td>ජය ස්ථාවර තැන්පතු - අවුරුදු 1</td>
                <td>12.00%</td>
                <td>10.00%</td>
            </tr>
            <tr>
                <td><strong>FD_JAY_24M</strong></td>
                <td>ජය ස්ථාවර තැන්පතු - අවුරුදු 2</td>
                <td>15.00%</td>
                <td>13.00%</td>
            </tr>
            <tr>
                <td><strong>FD_JAY_60M</strong></td>
                <td>ජය ස්ථාවර තැන්පතු - අවුරුදු 5</td>
                <td>15.00%</td>
                <td>13.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SIY_3M</strong></td>
                <td>සියවස් ස්ථාවර තැන්පතු - මාස 3</td>
                <td>10.00%</td>
                <td>8.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SIY_1Y</strong></td>
                <td>සියවස් ස්ථාවර තැන්පතු - අවුරුදු 1</td>
                <td>12.00%</td>
                <td>10.00%</td>
            </tr>
            <tr>
                <td><strong>FD_SIY_60M</strong></td>
                <td>සියවස් ස්ථාවර තැන්පතු - අවුරුදු 5</td>
                <td>15.00%</td>
                <td>13.00%</td>
            </tr>
        </tbody>
    </table>

</body>
</html>
"""

# Save html content
with open("fd_guidelines.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML generated successfully. Compiling PDF via Edge...")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_output = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\fixed_deposit_guidelines.pdf"
html_input = os.path.abspath("fd_guidelines.html")

try:
    if os.path.exists(pdf_output):
        os.remove(pdf_output)
except PermissionError:
    print("\n[ERROR] The PDF file 'fixed_deposit_guidelines.pdf' is currently open in your browser or a PDF reader. Please close it first and then run again!\n")
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
