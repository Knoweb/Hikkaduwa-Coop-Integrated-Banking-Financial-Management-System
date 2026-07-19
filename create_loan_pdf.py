import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <title>Excel Data Entry Guidelines - Loans</title>
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

    <h1>Excel දත්ත ඇතුලත් කිරීමේ මාර්ගෝපදේශය (ණය ගිණුම්)</h1>
    
    <h2>1. ණය Excel එක පුරවන ආකාරය (Loan Template)</h2>
    <ul>
        <li><strong>පද්ධතියෙන් සෑදෙන තීරු (රතු පැහැති):</strong> <code>loan_id</code> සහ <code>created_at</code> යන තීරු <strong>සම්පූර්ණයෙන්ම හිස්ව තබන්න</strong>.</li>
        <li><strong>සාමාජිකයා සම්බන්ධ කිරීම (Linking Members):</strong>
            <ul>
                <li><code>membership_number</code> තීරුවට ණයකරුගේ නිවැරදි සාමාජික අංකය (උදා: <code>M-1-1001</code>) ඇතුලත් කරන්න.</li>
                <li><code>member_nic</code> තීරුවට ණයකරුගේ හැඳුනුම්පත් අංකය ඇතුලත් කරන්න. (වැඩි ආරක්ෂාවට මේ දෙකම ඇතුලත් කිරීම ඉතා වැදගත් වේ).</li>
            </ul>
        </li>
        <li><strong>branch_id (ශාඛාවේ අංකය):</strong> <strong>ණයකරු ලියාපදිංචි කර ඇති ශාඛාවේ අංකයම</strong> (1, 2, හෝ 3) මෙතැනට ඇතුලත් කරන්න. (උදා: සාමාජිකයා 1 වන ශාඛාවේ නම්, ගිණුමේ branch_id එකටද <code>1</code> ඇතුලත් කරන්න).</li>
        <li><strong>ඇපකරුවන් (Guarantors):</strong>
            <ul>
                <li>ණය සඳහා ඇපකරුවන් 2ක් දක්වා විස්තර (නම, NIC, දුරකථන, ලිපිනය, රැකියාව සහ ආදායම) ඇතුලත් කළ හැක.</li>
                <li>ඇපකරුවන් අවශ්‍ය නොවන ණය වර්ග වලදී හෝ තනි ඇපකරුවෙකු පමණක් සිටින විට ඉතිරි තීරු (කහ පැහැති) <strong>හිස්ව තබන්න</strong>.</li>
            </ul>
        </li>
    </ul>

    <div class="page-break"></div>

    <h2>2. ණය Excel තීරු විස්තරය (Columns Legend)</h2>
    
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
                <td><strong>loan_type_code</strong></td>
                <td>ණය වර්ගය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>Dropdown එකෙන් අදාළ ණය වර්ගය තෝරන්න (උදා: <code>පාරිභෝගික ණය</code>, <code>කෙටි ණය</code>, <code>ආපදා ණය</code>).</td>
            </tr>
            <tr>
                <td><strong>account_number</strong></td>
                <td>ණය ගිණුම් අංකය</td>
                <td>පෙළ (Text)</td>
                <td>පද්ධතියට ඇතුලත් කරන ණය ගිණුම් අංකය (උදා: <code>LN-HKW-2026-4728</code>).</td>
            </tr>
            <tr>
                <td><strong>membership_number</strong></td>
                <td>සාමාජික අංකය</td>
                <td>පෙළ (Text)</td>
                <td>ණයකරුගේ සාමාජික අංකය.</td>
            </tr>
            <tr>
                <td><strong>member_nic</strong></td>
                <td>ණයකරුගේ NIC</td>
                <td>පෙළ (Text)</td>
                <td>ණයකරුගේ ජාතික හැඳුනුම්පත් අංකය.</td>
            </tr>
            <tr>
                <td><strong>requested_amount</strong></td>
                <td>ඉල්ලුම් කළ මුදල</td>
                <td>මුදල (Number)</td>
                <td>අයදුම්කරු ඉල්ලුම් කළ සම්පූර්ණ ණය මුදල.</td>
            </tr>
            <tr>
                <td><strong>term_months</strong></td>
                <td>ණය කාලය (මාස)</td>
                <td>අංකයක් (Number)</td>
                <td>ණය ආපසු ගෙවීමට ලබාදෙන කාලය මාස වලින් (උදා: <code>12</code>, <code>36</code>).</td>
            </tr>
            <tr>
                <td><strong>applied_date</strong></td>
                <td>අයදුම් කළ දිනය</td>
                <td>දිනය (YYYY-MM-DD)</td>
                <td>ණය අයදුම් කළ දිනය. හිස්ව තැබුවහොත් අද දිනය වැටේ.</td>
            </tr>
            <tr>
                <td><strong>disbursement_date</strong></td>
                <td>ණය නිකුත් කළ දිනය</td>
                <td>දිනය (YYYY-MM-DD)</td>
                <td>ණය මුදල සාමාජිකයාට නිකුත් කළ සැබෑ දිනය.</td>
            </tr>
            <tr>
                <td><strong>status</strong></td>
                <td>ණයේ වත්මන් තත්වය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>ණයේ වත්මන් තත්වය (<code>ACTIVE</code>, <code>PENDING</code>, <code>DISBURSED</code>, <code>CLOSED</code>, <code>REJECTED</code>).</td>
            </tr>
            <tr>
                <td><strong>loan_purpose</strong></td>
                <td>ණය අරමුණ</td>
                <td>පෙළ (Text)</td>
                <td>ණය ලබාගැනීමේ අරමුණ (උදා: <code>For buying a laptop</code>).</td>
            </tr>
            <tr>
                <td><strong>primary_job</strong></td>
                <td>අයදුම්කරුගේ රැකියාව</td>
                <td>පෙළ (Text)</td>
                <td>ණයකරුගේ රැකියාව (උදා: <code>Teacher</code>).</td>
            </tr>
            <tr>
                <td><strong>annual_income_primary</strong></td>
                <td>වාර්ෂික රැකියා ආදායම</td>
                <td>මුදල (Number)</td>
                <td>ණයකරුගේ ප්‍රධාන රැකියාවෙන් ලැබෙන වාර්ෂික ආදායම.</td>
            </tr>
            <tr>
                <td><strong>guarantor1_name / nic / phone</strong></td>
                <td>1 වන ඇපකරුගේ විස්තර</td>
                <td>පෙළ (Text)</td>
                <td>1 වන ඇපකරුගේ සම්පූර්ණ නම, හැඳුනුම්පත් අංකය, දුරකථනය.</td>
            </tr>
            <tr>
                <td><strong>guarantor1_address / job / income</strong></td>
                <td>1 වන ඇපකරුගේ අමතර විස්තර</td>
                <td>පෙළ / මුදල</td>
                <td>1 වන ඇපකරුගේ ලිපිනය, රැකියාව සහ වාර්ෂික ප්‍රාථමික ආදායම.</td>
            </tr>
            <tr>
                <td><strong>guarantor2_name / nic / phone</strong></td>
                <td>2 වන ඇපකරුගේ විස්තර</td>
                <td>පෙළ (Text)</td>
                <td><span class="badge-yellow">ඇත්නම් පමණි</span>. 2 වන ඇපකරුගේ සම්පූර්ණ නම, NIC, දුරකථනය.</td>
            </tr>
            <tr>
                <td><strong>guarantor2_address / job / income</strong></td>
                <td>2 වන ඇපකරුගේ අමතර විස්තර</td>
                <td>පෙළ / මුදල</td>
                <td><span class="badge-yellow">ඇත්නම් පමණි</span>. 2 වන ඇපකරුගේ ලිපිනය, රැකියාව සහ වාර්ෂික ආදායම.</td>
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
                <td><strong>loan_id</strong></td>
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

    <div class="page-break"></div>

    <h2>3. ණය වර්ග සහ පොළී අනුපාතයන් (Loan Types Reference)</h2>
    <p>ණය ගිණුම ආරම්භ කිරීමේදී <code>loan_type_code</code> තීරුව සඳහා පහත කේතයන්ගෙන් අදාළ එකක් තෝරාගත යුතුය. එක් එක් කේතයට අදාළ විස්තරය සහ පොලී අනුපාතයන් පහත පරිදි වේ:</p>
    <table>
        <thead>
            <tr>
                <th style="width: 35%;">ණය වර්ගය (Loan Type)</th>
                <th style="width: 25%;">පොළී අනුපාතය (Interest Rate)</th>
                <th style="width: 20%;">උපරිම කාලය (Max Term)</th>
                <th style="width: 20%;">උපරිම මුදල (Max Amount)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>පාරිභෝගික ණය</strong></td>
                <td>12.00%</td>
                <td>මාස 60</td>
                <td>Rs. 500,000.00</td>
            </tr>
            <tr>
                <td><strong>කෙටි ණය</strong></td>
                <td>14.00%</td>
                <td>මාස 12</td>
                <td>Rs. 100,000.00</td>
            </tr>
            <tr>
                <td><strong>සේවක ණය</strong></td>
                <td>10.00%</td>
                <td>මාස 36</td>
                <td>Rs. 300,000.00</td>
            </tr>
            <tr>
                <td><strong>ආපදා ණය</strong></td>
                <td>8.00%</td>
                <td>මාස 10</td>
                <td>Rs. 50,000.00</td>
            </tr>
            <tr>
                <td><strong>FD ණය (ස්ථාවර තැන්පතු ණය)</strong></td>
                <td>11.00%</td>
                <td>මාස 60</td>
                <td>Rs. 1,000,000.00</td>
            </tr>
            <tr>
                <td><strong>අර්ත සාදක ණය</strong></td>
                <td>9.00%</td>
                <td>මාස 60</td>
                <td>Rs. 500,000.00</td>
            </tr>
            <tr>
                <td><strong>දුරකථන ණය</strong></td>
                <td>15.00%</td>
                <td>මාස 24</td>
                <td>Rs. 100,000.00</td>
            </tr>
            <tr>
                <td><strong>මහා සභා ණය</strong></td>
                <td>12.00%</td>
                <td>මාස 36</td>
                <td>Rs. 200,000.00</td>
            </tr>
            <tr>
                <td><strong>MPCS ණය (විවිධ සේවා සමූපාකාර සමිති ණය)</strong></td>
                <td>10.00%</td>
                <td>මාස 60</td>
                <td>Rs. 2,000,000.00</td>
            </tr>
            <tr>
                <td><strong>කොටස් මත ණය</strong></td>
                <td>12.00%</td>
                <td>මාස 12</td>
                <td>Rs. 50,000.00</td>
            </tr>
            <tr>
                <td><strong>අත්තිකාරම් ණය</strong></td>
                <td>0.00%</td>
                <td>මාස 6</td>
                <td>Rs. 25,000.00</td>
            </tr>
            <tr>
                <td><strong>කල්පසු ණය</strong></td>
                <td>24.00%</td>
                <td>-</td>
                <td>නැත</td>
            </tr>
            <tr>
                <td><strong>සමිතියේ කල්පසු ණය</strong></td>
                <td>24.00%</td>
                <td>-</td>
                <td>නැත</td>
            </tr>
        </tbody>
    </table>

</body>
</html>
"""

# Save html content
with open("loan_guidelines.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML generated successfully. Compiling PDF via Edge...")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_output = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\loan_guidelines.pdf"
html_input = os.path.abspath("loan_guidelines.html")

try:
    if os.path.exists(pdf_output):
        os.remove(pdf_output)
except PermissionError:
    print("\n[ERROR] The PDF file 'loan_guidelines.pdf' is currently open in your browser or a PDF reader. Please close it first and then run again!\n")
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
