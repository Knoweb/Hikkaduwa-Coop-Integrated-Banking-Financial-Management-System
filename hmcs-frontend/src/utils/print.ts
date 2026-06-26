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

  const date = new Date(ticket.issueDate).toLocaleDateString('en-GB');
  const printed = new Date().toLocaleString('en-US');
  const memberName = ticket.memberName || (ticket.memberDetails ? (ticket.memberDetails.fullNameSinhala || ticket.memberDetails.fullName) : 'N/A');
  const memberNic = ticket.memberNic || (ticket.memberDetails ? ticket.memberDetails.nic : 'N/A');

  const html = `<!DOCTYPE html>
<html lang="si">
<head>
  <meta charset="UTF-8">
  <title>Pawn Ticket - ${ticket.ticketNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;600;800&family=Inter:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap');
    @page { size: A4 portrait; margin: 20mm; }
    body { font-family: 'Inter', 'Noto Sans Sinhala', sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; }
    
    .ticket-container { border: 2px solid #b45309; padding: 30px; position: relative; border-radius: 10px; background: #fffaf0; }
    .bg-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(180, 83, 9, 0.04); font-weight: 900; white-space: nowrap; pointer-events: none; z-index: 0; }
    
    .header { text-align: center; border-bottom: 2px solid #b45309; padding-bottom: 15px; margin-bottom: 25px; position: relative; z-index: 1; }
    .bank-name { font-size: 26px; font-weight: 800; color: #92400e; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
    .branch-name { font-size: 14px; color: #b45309; margin: 0; font-weight: 600; letter-spacing: 0.5px; }
    
    .title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; position: relative; z-index: 1; }
    .title { font-size: 18px; font-weight: 800; background-color: #b45309; color: #fff; padding: 6px 16px; border-radius: 4px; display: inline-block; letter-spacing: 1px; }
    .ticket-no { font-family: 'Space Mono', monospace; font-size: 18px; font-weight: 700; color: #78350f; background: #fef3c7; padding: 5px 12px; border-radius: 4px; border: 1px solid #fde68a; }
    
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 25px; font-size: 12px; font-weight: 600; color: #451a03; border-bottom: 1px dashed #d97706; padding-bottom: 10px; position: relative; z-index: 1; }
    
    .section-title { font-size: 14px; font-weight: 800; color: #78350f; border-left: 4px solid #b45309; padding-left: 10px; margin: 20px 0 10px 0; position: relative; z-index: 1; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; position: relative; z-index: 1; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #fde68a; }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #fef3c7; }
    th { width: 45%; font-weight: 700; color: #92400e; background-color: #fffbeb; }
    td { font-weight: 600; color: #451a03; }
    .td-number { font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 700; }
    
    .amount-highlight { background-color: #fef3c7; color: #b45309; font-size: 16px; font-weight: 800; }
    
    .conditions { font-size: 11px; margin-top: 25px; text-align: justify; color: #78350f; line-height: 1.5; padding: 15px; background: #fffbeb; border-radius: 8px; border: 1px solid #fde68a; position: relative; z-index: 1; }
    
    .signatures { margin-top: 60px; display: flex; justify-content: space-between; position: relative; z-index: 1; }
    .sig-block { width: 28%; text-align: center; }
    .sig-line { border-top: 1px dashed #b45309; margin-top: 40px; padding-top: 8px; font-size: 11px; font-weight: 700; color: #92400e; }
    
    .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #b45309; position: relative; z-index: 1; font-family: 'Space Mono', monospace; }
    
    @media print { 
      body { margin: 0; }
      .ticket-container { border: 2px solid #000; background: #fff; border-radius: 0; }
      .bg-watermark { display: none; }
      .title { background-color: #000; color: #fff; }
      .ticket-no, table, .conditions { border-color: #000; background: #fff; color: #000; }
      th { background-color: #f0f0f0; color: #000; }
      .bank-name, .branch-name, .section-title, th, td, .amount-highlight, .conditions, .sig-line, .footer { color: #000; }
      .sig-line { border-color: #000; }
      .header { border-color: #000; }
      .meta-row { border-color: #000; }
    }
  </style>
</head>
<body>
  <div class="ticket-container">
    <div class="bg-watermark">HMCS PAWNING</div>
    
    <div class="header">
      <h1 class="bank-name">Hikkaduwa Co-operative Society Bank</h1>
      <p class="branch-name">Hikkaduwa Branch (හික්කඩුව ශාඛාව)</p>
    </div>

    <div class="title-row">
      <div class="title">උකස් පත්‍රිකාව (PAWN TICKET)</div>
      <div class="ticket-no">TKT No: PW-${ticket.ticketNumber}</div>
    </div>

    <div class="meta-row">
      <div>Issue Date / නිකුත් කළ දිනය: ${date}</div>
      <div>Valuer / තක්සේරුකරු: HMCS Valuer</div>
    </div>

    <div class="section-title">1. Customer Details (පාරිභෝගික තොරතුරු)</div>
    <table>
      <tr><th>Customer Name (නම)</th><td>${memberName.toUpperCase()}</td></tr>
      <tr><th>NIC Number (ජා.හැ.ප)</th><td class="td-number">${memberNic}</td></tr>
    </table>

    <div class="section-title">2. Article Details (භාණ්ඩයේ තොරතුරු)</div>
    <table>
      <tr><th>Article Description (විස්තරය)</th><td>${ticket.articleDescription}</td></tr>
      <tr><th>Gross Weight (දළ බර)</th><td class="td-number">${ticket.grossWeightGrams} g</td></tr>
      <tr><th>Net Weight (ශුද්ධ බර)</th><td class="td-number">${ticket.netWeightGrams} g</td></tr>
      <tr><th>Purity (කැරට් අගය)</th><td class="td-number">${ticket.purityKarat}K</td></tr>
      <tr><th>Assessed Value (තක්සේරු වටිනාකම)</th><td class="td-number">Rs. ${Number(ticket.assessedValue).toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
    </table>

    <div class="section-title">3. Loan Details (ණය තොරතුරු)</div>
    <table>
      <tr><th class="amount-highlight">Advance Amount (අත්තිකාරම් මුදල)</th><td class="td-number amount-highlight">Rs. ${Number(ticket.advanceAmount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td></tr>
      <tr><th>Interest Rate (වාර්ෂික පොලිය)</th><td class="td-number">${ticket.interestRate}% p.a.</td></tr>
      <tr><th>Status (තත්ත්වය)</th><td>ACTIVE</td></tr>
    </table>

    <div class="conditions">
      <strong>Terms & Conditions (කොන්දේසි):</strong><br/>
      1. Please surrender this ticket to redeem the articles. (භාණ්ඩ බේරා ගැනීම සඳහා මෙම පත්‍රිකාව ඉදිරිපත් කිරීම අනිවාර්ය වේ.)<br/>
      2. Articles not redeemed within 1 year will be auctioned. (වසරක් ඇතුළත බේරා නොගන්නා භාණ්ඩ වෙන්දේසි කිරීමට බැංකුවට බලය ඇත.)<br/>
      3. Interest is calculated based on the daily reducing balance method. (දිනපතා අඩුවන ශේෂ ක්‍රමය මත පොලිය ගණනය කෙරේ.)<br/>
      4. Safe custody of this ticket is the responsibility of the customer. (මෙම පත්‍රිකාව සුරක්ෂිතව තබා ගැනීම පාරිභෝගිකයාගේ වගකීමකි.)
    </div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line">Valuer Signature<br>(තක්සේරුකරුගේ අත්සන)</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Manager Signature<br>(කළමනාකරුගේ අත්සන)</div>
      </div>
      <div class="sig-block">
        <div class="sig-line">Customer Signature<br>(පාරිභෝගික අත්සන)</div>
      </div>
    </div>

    <div class="footer">
      Generated by HMCS Banking System &bull; Printed: ${printed}
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 800);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
};
export const printAccountStatement = (passbookData: any) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const printed = new Date().toLocaleString('en-US');
  const accNo = passbookData.account?.accountNumber || 'N/A';
  const balance = Number(passbookData.account?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const interestRate = (passbookData.account?.annualInterestRate || 0).toFixed(2);
  const status = passbookData.account?.status || 'UNKNOWN';
  
  let trxRows = '';
  if (passbookData.transactions && passbookData.transactions.length > 0) {
    passbookData.transactions.forEach((tx: any) => {
      const date = new Date(tx.transactionDate).toLocaleDateString('en-GB');
      const isDeposit = tx.transactionType === 'DEPOSIT';
      const depositAmt = isDeposit ? Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-';
      const withdrawAmt = !isDeposit ? Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-';
      const runningBalance = Number(tx.runningBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
      
      trxRows += `
        <tr>
          <td>${date}</td>
          <td>${tx.description || tx.transactionType}</td>
          <td class="text-right" style="color: #ef4444;">${withdrawAmt}</td>
          <td class="text-right" style="color: #10b981;">${depositAmt}</td>
          <td class="text-right font-bold">${runningBalance}</td>
        </tr>
      `;
    });
  } else {
    trxRows = `<tr><td colspan="5" style="text-align:center; padding:20px;">No transactions found</td></tr>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Statement - ${accNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Space+Mono:wght@400;700&display=swap');
    body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; font-size: 12px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
    .bank-name { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .bank-sub { font-size: 12px; color: #64748b; font-weight: 600; }
    .title { font-size: 18px; font-weight: 700; margin: 20px 0; text-align: center; background: #f1f5f9; padding: 10px; border-radius: 8px; }
    
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
    .summary-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .summary-value { font-family: 'Space Mono', monospace; font-size: 16px; font-weight: 700; color: #0f172a; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
    th { background: #f8fafc; text-align: left; padding: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; font-family: 'Space Mono', monospace; }
    
    .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    
    @media print {
      body { padding: 0; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="bank-name">HMCS Bank</div>
    <div class="bank-sub">Hikkaduwa Co-op Integrated Banking Financial Management System</div>
  </div>
  
  <div class="title">ACCOUNT PASSBOOK / STATEMENT</div>
  
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Account Number</div>
      <div class="summary-value">${accNo}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Current Balance</div>
      <div class="summary-value">Rs. ${balance}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Interest Rate</div>
      <div class="summary-value">${interestRate}% p.a.</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">Status</div>
      <div class="summary-value" style="color: ${status === 'ACTIVE' ? '#10b981' : '#ef4444'}">${status}</div>
    </div>
  </div>

  <h3 style="font-size: 14px; margin-bottom: 10px; color: #334155;">Transaction History</h3>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th class="text-right">Withdrawals</th>
        <th class="text-right">Deposits</th>
        <th class="text-right">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${trxRows}
    </tbody>
  </table>

  <div class="footer">
    <p>Statement generated on ${printed}</p>
    <p>This is a computer generated document and does not require a signature.</p>
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

