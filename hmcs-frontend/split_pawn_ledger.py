with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''      // 4. Pawning
      const pawnList: any[] = [];
      if (filteredPawn.length > 0) {
        const totalPawnAdvance = filteredPawn.reduce((sum: number, t: any) => sum + (Number(t.remainingAdvance || t.advanceAmount) || 0), 0);
        pawnList.push({ name: 'උකස් අත්තිකාරම් (Pawn Advances)', count: filteredPawn.length, balance: totalPawnAdvance });
      }

      const totalS = filteredSavings.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
      const totalF = fdList.reduce((s, i) => s + i.balance, 0);
      const totalL = loanList.reduce((s, i) => s + i.balance, 0);
      const totalP = pawnList.reduce((s, i) => s + i.balance, 0);'''

replacement = '''      // 4. Pawning
      const totalPawnLoan = filteredPawn.reduce((sum: number, t: any) => sum + (Number(t.advanceAmount) || 0), 0);
      let totalPaymentsCount = 0;
      let totalPaymentsAmount = 0;
      filteredPawn.forEach((t: any) => {
        if (t.payments && Array.isArray(t.payments)) {
          totalPaymentsCount += t.payments.length;
          totalPaymentsAmount += t.payments.reduce((sum: number, p: any) => sum + (Number(p.paymentAmount) || 0), 0);
        }
      });

      const pawnList: any[] = [];
      if (filteredPawn.length > 0) {
        pawnList.push({ name: 'උකස් ණය (Pawn Loans)', count: filteredPawn.length, balance: totalPawnLoan });
        pawnList.push({ name: 'උකස් වාරික (Pawn Repayments)', count: totalPaymentsCount, balance: totalPaymentsAmount });
      }

      const totalS = filteredSavings.reduce((s: number, a: any) => s + (Number(a.balance) || 0), 0);
      const totalF = fdList.reduce((s, i) => s + i.balance, 0);
      const totalL = loanList.reduce((s, i) => s + i.balance, 0);
      const totalP = totalPawnLoan - totalPaymentsAmount;'''

content = content.replace(target, replacement)
content = content.replace(target.replace('\n', '\r\n'), replacement)

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
