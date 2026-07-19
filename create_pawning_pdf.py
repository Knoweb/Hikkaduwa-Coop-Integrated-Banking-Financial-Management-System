import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="si">
<head>
    <meta charset="UTF-8">
    <title>Excel Data Entry Guidelines - Pawning</title>
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

    <h1>Excel දත්ත ඇතුලත් කිරීමේ මාර්ගෝපදේශය (උකස්පත් - Pawning)</h1>
    
    <h2>1. උකස් Excel එක පුරවන ආකාරය (Pawning Template)</h2>
    <ul>
        <li><strong>පද්ධතියෙන් සෑදෙන තීරු (රතු පැහැති):</strong> <code>ticket_id</code> සහ <code>valuer_id</code> යන තීරු <strong>සම්පූර්ණයෙන්ම හිස්ව තබන්න</strong>.</li>
        <li><strong>සාමාජිකයා සම්බන්ධ කිරීම (Linking Members):</strong>
            <ul>
                <li><code>membership_number</code> තීරුවට උකස්කරුගේ නිවැරදි සාමාජික අංකය (උදා: <code>M-1-1001</code>) ඇතුලත් කරන්න.</li>
                <li><code>member_nic</code> තීරුවට උකස්කරුගේ හැඳුනුම්පත් අංකය ඇතුලත් කරන්න. (වැඩි ආරක්ෂාවට මේ දෙකම ඇතුලත් කිරීම ඉතා වැදගත් වේ).</li>
            </ul>
        </li>
        <li><strong>tenant_id (බැංකු කේතය):</strong> සාමාන්‍යයෙන් <strong>1</strong> ලෙස ඇතුලත් කරන්න.</li>
        <li><strong>branch_id (ශාඛාවේ අංකය):</strong> <strong>සාමාජිකයා ලියාපදිංචි කර ඇති ශාඛාවේ අංකයම</strong> (1, 2, හෝ 3) මෙතැනට ඇතුලත් කරන්න.</li>
        <li><strong>කැරට් ප්‍රමාණය (Purity Karat):</strong> Drop-down එකෙන් රන් භාණ්ඩ වල අදාළ කැරට් ප්‍රමාණය (<code>24</code>, <code>22</code>, <code>21</code>, <code>20</code> හෝ <code>18</code>) තෝරන්න.</li>
        <li><strong>දිනයන් (Issue Date):</strong>
            <ul>
                <li><code>issue_date</code> තීරුව හිස්ව තැබුවහොත් අද දිනය ස්වයංක්‍රීයව ඇතුලත් වේ.</li>
            </ul>
        </li>
        <li><strong>පොළී අනුපාතය (Interest Rate):</strong> උකස්පත් සඳහා පද්ධතියේ default වාර්ෂික පොළී අනුපාතය වන <strong>13.00%</strong> ස්වයංක්‍රීයවම අදාළ කරගනු ලැබේ.</li>
    </ul>

    <div class="page-break"></div>

    <h2>2. උකස් Excel තීරු විස්තරය (Columns Legend)</h2>
    
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
                <td><strong>ticket_number</strong></td>
                <td>උකස්පත් අංකය</td>
                <td>පෙළ (Text)</td>
                <td>පද්ධතියට ඇතුලත් කරන උකස්පත් අංකය (උදා: <code>698594</code>).</td>
            </tr>
            <tr>
                <td><strong>membership_number</strong></td>
                <td>සාමාජික අංකය</td>
                <td>පෙළ (Text)</td>
                <td>උකස්කරුගේ සාමාජික අංකය.</td>
            </tr>
            <tr>
                <td><strong>member_nic</strong></td>
                <td>උකස්කරුගේ NIC</td>
                <td>පෙළ (Text)</td>
                <td>උකස්කරුගේ ජාතික හැඳුනුම්පත් අංකය.</td>
            </tr>
            <tr>
                <td><strong>gross_weight_grams</strong></td>
                <td>මුළු බර (ග්‍රෑම්)</td>
                <td>බර (Decimal)</td>
                <td>රන් භාණ්ඩවල මුළු බර ග්‍රෑම් වලින් (උදා: <code>15.00</code>).</td>
            </tr>
            <tr>
                <td><strong>net_weight_grams</strong></td>
                <td>ශුද්ධ බර (ග්‍රෑම්)</td>
                <td>බර (Decimal)</td>
                <td>රන් භාණ්ඩවල ශුද්ධ රන් බර ග්‍රෑම් වලින් (උදා: <code>10.00</code>).</td>
            </tr>
            <tr>
                <td><strong>purity_karat</strong></td>
                <td>රන්වල කැරට් ප්‍රමාණය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>Dropdown එකෙන් තෝරන්න: <code>24</code>, <code>22</code>, <code>21</code>, <code>20</code> හෝ <code>18</code>.</td>
            </tr>
            <tr>
                <td><strong>advance_amount</strong></td>
                <td>උකස් ණය මුදල</td>
                <td>මුදල (Number)</td>
                <td>සාමාජිකයාට ලබාදුන් මුදල (Advance Amount).</td>
            </tr>
            <tr>
                <td><strong>issue_date</strong></td>
                <td>උකස් කළ දිනය</td>
                <td>දිනය (YYYY-MM-DD)</td>
                <td>උකස් කළ දිනය. හිස්ව තැබුවහොත් අද දිනය වැටේ.</td>
            </tr>
            <tr>
                <td><strong>status</strong></td>
                <td>උකස්පතෙහි වත්මන් තත්වය</td>
                <td>Dropdown ලැයිස්තුව</td>
                <td>Dropdown එකෙන් තෝරන්න: <code>ACTIVE</code>, <code>REDEEMED</code>, <code>OVERDUE</code> හෝ <code>AUCTIONED</code>.</td>
            </tr>
            <tr>
                <td><strong>article_description</strong></td>
                <td>රන් භාණ්ඩ විස්තරය</td>
                <td>පෙළ (Text)</td>
                <td>උකස් කළ රන් භාණ්ඩ විස්තරය (උදා: <code>Gold Chain</code>, <code>Gold Ring</code>).</td>
            </tr>
            <tr>
                <td><strong>tenant_id</strong></td>
                <td>බැංකු කේතය</td>
                <td>අංකයක් (Number)</td>
                <td>සාමාන්‍යයෙන් <code>1</code> ලෙස යොදන්න.</td>
            </tr>
            <tr>
                <td><strong>branch_id</strong></td>
                <td>ශාඛාවේ අංකය</td>
                <td>අංකයක් (Number)</td>
                <td>සාමාජිකයා ලියාපදිංචි වී ඇති ශාඛාවේ අංකය (1, 2, හෝ 3).</td>
            </tr>
            <tr>
                <td><strong>ticket_id</strong></td>
                <td>පද්ධති ID (UUID)</td>
                <td>පෙළ (UUID)</td>
                <td><span class="badge-red">DO NOT FILL</span> - සම්පූර්ණයෙන්ම හිස්ව තබන්න.</td>
            </tr>
            <tr>
                <td><strong>valuer_id</strong></td>
                <td>තක්සේරුකරුගේ ID</td>
                <td>පෙළ (UUID)</td>
                <td><span class="badge-red">DO NOT FILL</span> - සම්පූර්ණයෙන්ම හිස්ව තබන්න. පද්ධතියෙන් default placeholder UUID එකක් යොදා ගනී.</td>
            </tr>
        </tbody>
    </table>

</body>
</html>
"""

# Save html content
with open("pawning_guidelines.html", "w", encoding="utf-8") as f:
    f.write(html_content)

print("HTML generated successfully. Compiling PDF via Edge...")

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
pdf_output = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\pawning_guidelines.pdf"
html_input = os.path.abspath("pawning_guidelines.html")

try:
    if os.path.exists(pdf_output):
        os.remove(pdf_output)
except PermissionError:
    print("\n[ERROR] The PDF file 'pawning_guidelines.pdf' is currently open in your browser or a PDF reader. Please close it first and then run again!\n")
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
