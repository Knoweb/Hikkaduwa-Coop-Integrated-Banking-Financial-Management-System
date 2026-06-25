export const getSinhalaAmountInWords = (amount: number): string => {
  if (!amount || isNaN(amount)) return "";

  const wholeNumber = Math.floor(amount);
  if (wholeNumber === 0) return "බිංදුවයි";

  const ones = ["", "එක", "දෙක", "තුන", "හතර", "පහ", "හය", "හත", "අට", "නවය"];
  const prefixes = ["", "එක්", "දෙ", "තුන්", "හතර", "පන්", "හය", "හත්", "අට", "නව"];
  const teens = ["දහය", "එකොළහ", "දොළහ", "දහතුන", "දාහතර", "පහළොව", "දහසය", "දාහත", "දහඅට", "දහනවය"];
  const teensPrefixes = ["දස", "එකොළොස්", "දොළොස්", "දහතුන්", "දාහතර", "පහළොස්", "දහසය", "දාහත්", "දහඅට", "දහනව"];
  const tens = ["", "දස", "විසි", "තිස්", "හතළිස්", "පණස්", "හැට", "හැත්තෑ", "අසූ", "අනූ"];
  const tensEnds = ["", "දහය", "විස්ස", "තිහ", "හතළිහ", "පනහ", "හැට", "හැත්තෑව", "අසූව", "අනූව"];

  const getTens = (n: number, isEnd: boolean): string => {
    if (n === 0) return "";
    if (n < 10) return isEnd ? ones[n] : prefixes[n];
    if (n < 20) return isEnd ? teens[n - 10] : teensPrefixes[n - 10]; 
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return isEnd ? tensEnds[t] : tens[t];
    return `${tens[t]} ${isEnd ? ones[u] : prefixes[u]}`;
  };

  const words: string[] = [];
  
  const crores = Math.floor(wholeNumber / 10000000);
  let rem = wholeNumber % 10000000;
  const lakhs = Math.floor(rem / 100000);
  rem %= 100000;
  const thousands = Math.floor(rem / 1000);
  rem %= 1000;
  const hundreds = Math.floor(rem / 100);
  const units = rem % 100;

  const hasMore = (val: number) => val > 0;

  if (crores > 0) {
    words.push(getTens(crores, false) + " කෝටි");
  }

  if (lakhs > 0) {
    if (!hasMore(rem)) {
      if (lakhs === 1) words.push("ලක්ෂයක්");
      else words.push(getTens(lakhs, false) + " ලක්ෂයක්");
    } else {
      if (lakhs === 1) words.push("ලක්ෂ");
      else words.push(getTens(lakhs, false) + " ලක්ෂ");
    }
  }

  if (thousands > 0) {
    if (!hasMore(hundreds) && !hasMore(units)) {
      if (thousands === 1) words.push("දහසක්");
      else words.push(getTens(thousands, false) + " දහසක්");
    } else {
      if (thousands === 1) words.push("එක්දහස්");
      else words.push(getTens(thousands, false) + " දහස්");
    }
  }

  if (hundreds > 0) {
    if (!hasMore(units)) {
      if (hundreds === 1) words.push("සියයක්");
      else words.push(prefixes[hundreds] + "සියයක්");
    } else {
      if (hundreds === 1) words.push("එක්සිය");
      else words.push(prefixes[hundreds] + "සිය");
    }
  }

  if (units > 0) {
    words.push(getTens(units, true) + "ක්");
  }

  let finalString = words.join(" ").trim();
  finalString = finalString.replace(/ක්ක්/g, "ක්");
  
  return finalString;
};
