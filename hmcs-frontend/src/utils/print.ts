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

  const date     = new Date().toLocaleDateString('en-GB');
  const time     = new Date().toLocaleTimeString('en-US', { hour12: false });
  const printed  = new Date().toLocaleString();
  const accNo    = loan.accountNumber || 'N/A';
  const amount   = Number(loan.disbursedAmount || loan.requestedAmount || 0)
                    .toLocaleString('en-US', { minimumFractionDigits: 2 });
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
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600;800&display=swap');
    @page { size: 80mm auto; margin: 0; }
    body { font-family: 'Inter', 'Noto Sans Sinhala', sans-serif; width: 76mm; margin: 2mm auto; color: #000; font-size: 11px; line-height: 1.4; }
    .slip-container { border: 1px solid #000; padding: 4mm; position: relative; }
    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
    .logo-text { font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin-bottom: 2px; color: #000; }
    .branch-text { font-size: 9px; font-weight: 700; letter-spacing: 0.5px; }
    .title { text-align: center; font-weight: 800; font-size: 11px; background: #000; color: #fff; padding: 4px 0; margin: 8px 0; letter-spacing: 1px; }
    
    .meta-row { display: flex; justify-content: space-between; font-family: 'Space Mono', monospace; font-size: 9px; margin-bottom: 3px; font-weight: 600; }
    
    .table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    .table th, .table td { border-bottom: 1px dotted #444; padding: 5px 0; vertical-align: top; }
    .table th { text-align: left; font-weight: 600; width: 45%; font-size: 10px; color: #222; }
    .table td { text-align: right; font-weight: 700; font-size: 11px; }
    
    .acc-number { font-family: 'Space Mono', monospace; font-size: 13px; font-weight: 700; padding-top: 2px; display: block; letter-spacing: 0.5px; }
    
    .amount-box { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin: 12px 0; display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-weight: 800; font-size: 11px; text-transform: uppercase; }
    .amount-value { font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 800; }
    
    .signatures { display: flex; justify-content: space-between; margin-top: 35px; }
    .sig-block { text-align: center; width: 45%; }
    .sig-line { border-top: 1px dashed #000; padding-top: 4px; font-size: 9px; font-weight: 700; }
    
    .footer { text-align: center; font-size: 8px; margin-top: 15px; border-top: 1px solid #000; padding-top: 5px; font-family: 'Space Mono', monospace; }
    
    .barcode { text-align: center; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; margin-top: 10px; }
    
    @media print { 
      body { margin: 0; padding: 0; }
      .slip-container { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="slip-container">
    <div class="header">
      <div class="logo-text">HIKKADUWA CO-OP BANK</div>
      <div class="branch-text">හික්කඩුව ශාඛාව &bull; HIKKADUWA BRANCH</div>
    </div>
    
    <div class="meta-row">
      <span>DATE: ${date}</span>
      <span>TIME: ${time}</span>
    </div>
    <div class="meta-row">
      <span>TRX: ${loan.loanId.substring(0,8).toUpperCase()}</span>
      <span>CSH: ${officerName.toUpperCase()}</span>
    </div>

    <div class="title">LOAN DISBURSEMENT SLIP</div>

    <table class="table">
      <tr>
        <th>Loan Account No.<br><span style="font-size:8px;">ණය ගිණුම් අංකය</span></th>
        <td><span class="acc-number">${accNo}</span></td>
      </tr>
      <tr>
        <th>Customer Name<br><span style="font-size:8px;">පාරිභෝගික නම</span></th>
        <td>${name.toUpperCase()}</td>
      </tr>
      <tr>
        <th>Member No / NIC<br><span style="font-size:8px;">සාමාජික අංකය/ජා.හැ.ප</span></th>
        <td style="font-family: 'Space Mono', monospace;">${memberNo} <br> ${nic}</td>
      </tr>
      <tr>
        <th>Loan Type<br><span style="font-size:8px;">ණය වර්ගය</span></th>
        <td>${loanType.toUpperCase()}</td>
      </tr>
      <tr>
        <th>Interest / Term<br><span style="font-size:8px;">පොලිය / කාලය</span></th>
        <td style="font-family: 'Space Mono', monospace;">${loan.interestRate}% p.a. <br> ${loan.termMonths} Months</td>
      </tr>
    </table>

    <div class="amount-box">
      <div class="amount-label">AMOUNT DISBURSED<br><span style="font-size:9px;">නිකුත් කළ මුදල</span></div>
      <div class="amount-value">LKR ${amount}</div>
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Officer Signature<br><span style="font-size:8px;">නිලධාරී අත්සන</span></div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Customer Signature<br><span style="font-size:8px;">පාරිභෝගික අත්සන</span></div>
      </div>
    </div>

    <div class="barcode">
      ||| |||| || ||| || ||| |||<br>
      *${accNo.replace(/[^a-zA-Z0-9]/g, '')}*
    </div>

    <div class="footer">
      PRINTED: ${printed}<br>
      THANK YOU FOR BANKING WITH US
    </div>
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

export const printPawnTicket = (ticket: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const date = new Date(ticket.issueDate).toLocaleDateString();
  const html = `<!DOCTYPE html>
<html lang="si">
<head>
  <meta charset="UTF-8">
  <title>Pawn Ticket - ${ticket.ticketNumber}</title>
  <style>
    body { font-family: 'Arial', sans-serif; padding: 20px; }
    h1 { text-align: center; font-size: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #000; padding: 10px; text-align: left; }
    .footer { margin-top: 50px; text-align: center; }
  </style>
</head>
<body>
  <h1>Co-op Rural Bank - Pawn Ticket</h1>
  <p>Ticket No: ${ticket.ticketNumber}</p>
  <p>Date: ${date}</p>
  <table>
    <tr><th>Article Description</th><td>${ticket.articleDescription}</td></tr>
    <tr><th>Gross Weight</th><td>${ticket.grossWeightGrams} g</td></tr>
    <tr><th>Net Weight</th><td>${ticket.netWeightGrams} g</td></tr>
    <tr><th>Purity</th><td>${ticket.purityKarat} Karat</td></tr>
    <tr><th>Assessed Value</th><td>Rs. ${ticket.assessedValue}</td></tr>
    <tr><th>Advance Amount</th><td>Rs. ${ticket.advanceAmount}</td></tr>
    <tr><th>Interest Rate</th><td>${ticket.interestRate}% p.a.</td></tr>
  </table>
  <div class="footer">
    <p>Please surrender this ticket to redeem the articles.</p>
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
