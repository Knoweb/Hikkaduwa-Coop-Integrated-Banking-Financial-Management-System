export const printLoanAgreement = (loan: any, ad: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const date = new Date().toLocaleDateString();
  const printed = new Date().toLocaleString();

  // Build guarantor section separately to avoid nested template literal issues
  let guarantorSection = '';
  if (ad.guarantor1 || ad.guarantor1Name) {
    const g1name = (ad.guarantor1 && ad.guarantor1.name) || ad.guarantor1Name || 'N/A';
    const g1nic  = (ad.guarantor1 && ad.guarantor1.nic)  || ad.guarantor1Nic  || 'N/A';
    let g2rows = '';
    if (ad.guarantor2 || ad.guarantor2Name) {
      const g2name = (ad.guarantor2 && ad.guarantor2.name) || ad.guarantor2Name || 'N/A';
      const g2nic  = (ad.guarantor2 && ad.guarantor2.nic)  || ad.guarantor2Nic  || 'N/A';
      g2rows = `
        <tr><th>2nd Guarantor Name (දෙවන ඇපකරු)</th><td>${g2name}</td></tr>
        <tr><th>2nd Guarantor NIC (ජා.හැ.ප. අංකය)</th><td>${g2nic}</td></tr>`;
    }
    guarantorSection = `
      <div class="section-title">3. Guarantor Details (ඇපකරුවන්ගේ තොරතුරු)</div>
      <table>
        <tr><th>1st Guarantor Name (පළමු ඇපකරු)</th><td>${g1name}</td></tr>
        <tr><th>1st Guarantor NIC (ජා.හැ.ප. අංකය)</th><td>${g1nic}</td></tr>
        ${g2rows}
      </table>`;
  }

  const loanTypeName = (loan.loanType && loan.loanType.name) || loan.loanTypeStr || 'N/A';
  const approvedAmount = Number(loan.requestedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const html = `<!DOCTYPE html>
<html lang="si">
<head>
  <meta charset="UTF-8">
  <title>Loan Agreement - ${ad.applicantName || ad.name || 'Applicant'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;800&family=Inter:wght@400;600;800&display=swap');
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Inter', 'Noto Sans Sinhala', sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; }
    .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 30px; }
    .bank-name { font-size: 24px; font-weight: 800; color: #1e3a8a; margin: 0 0 5px 0; }
    .branch-name { font-size: 16px; color: #64748b; margin: 0; }
    .title { font-size: 20px; font-weight: 800; text-align: center; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 1px; text-decoration: underline; }
    .section-title { font-size: 14px; font-weight: 800; color: #0f172a; background-color: #f1f5f9; padding: 6px 12px; margin-top: 25px; margin-bottom: 15px; border-left: 4px solid #2563eb; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { width: 40%; font-weight: 600; color: #475569; }
    td { font-weight: 600; color: #0f172a; }
    .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
    .sig-block { width: 30%; text-align: center; }
    .sig-line { border-top: 1px dashed #94a3b8; margin-top: 50px; padding-top: 10px; font-size: 12px; font-weight: 600; color: #475569; }
    .footer { margin-top: 40px; text-align: center; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="bank-name">Hikkaduwa Co-operative Society Bank</h1>
    <p class="branch-name">Hikkaduwa Branch (හික්කඩුව ශාඛාව)</p>
  </div>

  <div class="title">Loan Agreement (ණය ගිවිසුම)</div>

  <p style="text-align: right; font-size: 12px;"><strong>Date / දිනය :</strong> ${date}</p>

  <div class="section-title">1. Applicant Details (අයදුම්කරුගේ තොරතුරු)</div>
  <table>
    <tr><th>Full Name (සම්පූර්ණ නම)</th><td>${ad.applicantName || ad.name || 'N/A'}</td></tr>
    <tr><th>NIC Number (ජා.හැ.ප. අංකය)</th><td>${ad.nic || 'N/A'}</td></tr>
    <tr><th>Member Number (සාමාජික අංකය)</th><td>${ad.memberNo || ad.officeMemberNo || 'N/A'}</td></tr>
    <tr><th>Address (ලිපිනය)</th><td>${ad.addressLine1 || ad.address || 'N/A'}</td></tr>
    <tr><th>Contact Number (දුරකථන අංකය)</th><td>${ad.phone || 'N/A'}</td></tr>
  </table>

  <div class="section-title">2. Loan Details (ණය තොරතුරු)</div>
  <table>
    <tr><th>Loan Type (ණය වර්ගය)</th><td>${loanTypeName}</td></tr>
    <tr><th>Approved Amount (අනුමත මුදල)</th><td>Rs. ${approvedAmount}</td></tr>
    <tr><th>Interest Rate (පොලී අනුපාතය)</th><td>${loan.interestRate}% p.a.</td></tr>
    <tr><th>Repayment Period (ගෙවීමේ කාලය)</th><td>${loan.termMonths} Months</td></tr>
    <tr><th>Loan Purpose (ණය අරමුණ)</th><td>${ad.loanPurpose || 'N/A'}</td></tr>
  </table>

  ${guarantorSection}

  <p style="font-size: 12px; margin-top: 30px; text-align: justify;">
    I, the undersigned applicant, hereby confirm that the information provided above is true and accurate.
    I agree to abide by the terms and conditions set forth by the Hikkaduwa Co-operative Society Bank
    regarding the repayment of this loan, including the agreed interest rate and monthly installments.
    In the event of default, the bank reserves the right to recover the outstanding balance from my savings,
    assets, or through my guarantors.
    <br/><br/>
    ඉහත සඳහන් කළ සියලුම තොරතුරු සත්‍ය සහ නිවැරදි බවට මම මෙයින් සහතික කරමි. මෙම ණය මුදලට
    අදාළව හික්කඩුව සමූපකාර බැංකුව විසින් පනවා ඇති සියලුම නියමයන් සහ කොන්දේසිවලට එකඟ වන
    අතර, පොලිය සහ මාසික වාරික නිසි පරිදි ගෙවීමට මම එකඟ වෙමි.
  </p>

  <div class="signatures">
    <div class="sig-block">
      <div class="sig-line">Applicant Signature<br>(අයදුම්කරුගේ අත්සන)</div>
    </div>
    <div class="sig-block">
      <div class="sig-line">Manager Signature<br>(කළමනාකරුගේ අත්සන)</div>
    </div>
  </div>

  <div class="footer">
    Generated by HMCS Banking System &bull; Printed on ${printed}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};

export const printDisbursementReceipt = (loan: any, ad: any, officerName: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const date     = new Date().toLocaleDateString('si-LK');
  const time     = new Date().toLocaleTimeString();
  const printed  = new Date().toLocaleString();
  const accNo    = loan.accountNumber || 'N/A';
  const amount   = Number(loan.disbursedAmount || loan.requestedAmount || 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2 });
  const loanType = (loan.loanType && loan.loanType.name) || loan.loanTypeStr || 'N/A';
  const name     = ad.applicantName || ad.name || 'N/A';
  const nic      = ad.nic || 'N/A';
  const memberNo = ad.memberNo || ad.officeMemberNo || 'N/A';

  const html = `<!DOCTYPE html>
<html lang="si">
<head>
  <meta charset="UTF-8">
  <title>Loan Disbursement Receipt</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;800&family=Inter:wght@400;600;800&display=swap');
    @page { size: 80mm auto; margin: 5mm; }
    body { font-family: 'Inter', 'Noto Sans Sinhala', sans-serif; width: 72mm; margin: 0 auto; color: #1e293b; font-size: 12px; }
    .center { text-align: center; }
    .bold   { font-weight: 700; }
    .divider { border-top: 1px dashed #94a3b8; margin: 8px 0; }
    .bank-name { font-size: 15px; font-weight: 800; color: #1e3a8a; }
    .receipt-title { font-size: 13px; font-weight: 700; margin: 6px 0; background: #1e3a8a; color: white; padding: 5px 8px; text-align: center; }
    .acc-block { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 10px; margin: 8px 0; text-align: center; }
    .acc-label { font-size: 10px; color: #3b82f6; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .acc-number { font-size: 20px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px; margin-top: 4px; }
    .row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 11px; }
    .row-label { color: #64748b; }
    .row-value { font-weight: 600; text-align: right; max-width: 55%; }
    .amount-block { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 8px 10px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-size: 11px; color: #166534; }
    .amount-value { font-size: 16px; font-weight: 800; color: #15803d; }
    .footer { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 12px; }
    .stamp-area { margin-top: 30px; border-top: 1px dashed #94a3b8; padding-top: 8px; text-align: center; font-size: 10px; color: #64748b; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="center">
    <div class="bank-name">Hikkaduwa Co-operative<br>Society Bank</div>
    <div style="font-size: 10px; color: #64748b;">හික්කඩුව ශාඛාව &bull; Hikkaduwa Branch</div>
  </div>

  <div class="receipt-title">ණය නිකුත් කිරීමේ රිසිට්පත<br>LOAN DISBURSEMENT RECEIPT</div>

  <div class="acc-block">
    <div class="acc-label">ණය ගිණුම් අංකය / Loan Account No.</div>
    <div class="acc-number">${accNo}</div>
  </div>

  <div class="divider"></div>

  <div class="row"><span class="row-label">දිනය / Date</span><span class="row-value">${date}</span></div>
  <div class="row"><span class="row-label">වේලාව / Time</span><span class="row-value">${time}</span></div>

  <div class="divider"></div>

  <div class="row"><span class="row-label">ණය ලබාගන්නා (ගෙවන්නා)</span><span class="row-value bold">${name}</span></div>
  <div class="row"><span class="row-label">ජා.හැ.ප. / NIC</span><span class="row-value">${nic}</span></div>
  <div class="row"><span class="row-label">සාමාජික අංකය</span><span class="row-value">${memberNo}</span></div>

  <div class="divider"></div>

  <div class="row"><span class="row-label">ණය වර්ගය</span><span class="row-value">${loanType}</span></div>
  <div class="row"><span class="row-label">ගෙවීමේ කාලය</span><span class="row-value">${loan.termMonths} Months</span></div>
  <div class="row"><span class="row-label">පොලී අනුපාතය</span><span class="row-value">${loan.interestRate}% p.a.</span></div>

  <div class="divider"></div>

  <div class="amount-block">
    <span class="amount-label">නිකුත් කළ මුදල<br>Amount Disbursed</span>
    <span class="amount-value">Rs. ${amount}</span>
  </div>

  <div class="divider"></div>

  <div class="row"><span class="row-label">නිකුත් කළ නිලධාරී</span><span class="row-value">${officerName}</span></div>

  <div class="stamp-area">
    නිලධාරී අත්සන / Officer Signature<br><br><br>
    &bull; HMCS Banking System &bull;
  </div>

  <div class="footer">
    Printed: ${printed}<br>
    This is a computer generated receipt.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};

