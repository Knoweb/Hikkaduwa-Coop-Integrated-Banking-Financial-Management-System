export function numberToSinhala(num: number): string {
    if (num === 0) return 'බිංදුව';
    if (!num || isNaN(num)) return '';
    
    const ones = ['', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ', 'හය', 'හත', 'අට', 'නවය'];
    const teens = ['දහය', 'එකොළහ', 'දොළහ', 'දහතුන', 'දාහතර', 'පහළොව', 'දහසය', 'දාහත', 'දහඅට', 'දහනවය'];
    const tensPrefix = ['', 'දහ', 'විසි', 'තිස්', 'හතළිස්', 'පනස්', 'හැට', 'හැත්තෑ', 'අසූ', 'අනූ'];
    const tensExact = ['', 'දහය', 'විස්ස', 'තිහ', 'හතළිහ', 'පනහ', 'හැට', 'හැත්තෑව', 'අසූව', 'අනූව'];

    const hundredsPrefix = ['', 'එකසිය', 'දෙසිය', 'තුන්සිය', 'හාරසිය', 'පන්සිය', 'හයසිය', 'හත්සිය', 'අටසිය', 'නවසිය'];
    const hundredsExact = ['', 'සියය', 'දෙසියය', 'තුන්සියය', 'හාරසියය', 'පන්සියය', 'හයසියය', 'හත්සියය', 'අටසියය', 'නවසියය'];

    const thousandsPrefixWords = ['', 'එක්', 'දෙ', 'තුන්', 'හාර', 'පන්', 'හය', 'හත්', 'අට', 'නව'];

    function getBelow100(n: number): string {
        if (n === 0) return '';
        if (n < 10) return ones[n];
        if (n < 20) return teens[n - 10];
        const ten = Math.floor(n / 10);
        const rem = n % 10;
        if (rem === 0) return tensExact[ten];
        return tensPrefix[ten] + ' ' + ones[rem];
    }

    function getBelow100ForPrefix(n: number): string {
        if (n === 0) return '';
        if (n < 10) return thousandsPrefixWords[n];
        if (n < 20) return teens[n - 10];
        const ten = Math.floor(n / 10);
        const rem = n % 10;
        if (rem === 0) return tensPrefix[ten];
        return tensPrefix[ten] + ' ' + thousandsPrefixWords[rem];
    }

    function getBelow1000(n: number): string {
        if (n < 100) return getBelow100(n);
        const hundred = Math.floor(n / 100);
        const rem = n % 100;
        if (rem === 0) return hundredsExact[hundred];
        return hundredsPrefix[hundred] + ' ' + getBelow100(rem);
    }

    let words = [];
    let lakshas = Math.floor(num / 100000);
    let remAfterLaksha = num % 100000;
    
    if (lakshas > 0) {
        if (lakshas === 1) {
            words.push(remAfterLaksha === 0 ? 'ලක්ෂය' : 'එක්ලක්ෂ');
        } else {
            words.push('ලක්ෂ ' + getBelow100(lakshas));
        }
    }
    
    let thousands = Math.floor(remAfterLaksha / 1000);
    let remainder = remAfterLaksha % 1000;
    
    if (thousands > 0) {
        let tWord = remainder === 0 ? 'දහස' : 'දහස්';
        if (thousands === 1) {
            words.push('එක්' + tWord);
        } else if (thousands === 10) {
            words.push('දස' + tWord);
        } else if (thousands < 10) {
            words.push(thousandsPrefixWords[thousands] + tWord);
        } else {
            words.push(getBelow100ForPrefix(thousands) + tWord);
        }
    }
    
    if (remainder > 0) {
        words.push(getBelow1000(remainder));
    }
    
    return words.join(' ').replace(/\s+/g, ' ').trim();
}
