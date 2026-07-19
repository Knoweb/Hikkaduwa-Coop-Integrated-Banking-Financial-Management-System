const ones = ['', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ', 'හය', 'හත', 'අට', 'නවය'];
const teens = ['දහය', 'එකොළහ', 'දොළහ', 'දහතුන', 'දාහතර', 'පහළොව', 'දහසය', 'දාහත', 'දහඅට', 'දහනවය'];
const tensPrefix = ['', 'දහ', 'විසි', 'තිස්', 'හතළිස්', 'පනස්', 'හැට', 'හැත්තෑ', 'අසූ', 'අනූ'];
const tensExact = ['', 'දහය', 'විස්ස', 'තිහ', 'හතළිහ', 'පනහ', 'හැට', 'හැත්තෑව', 'අසූව', 'අනූව'];

const hundredsPrefix = ['', 'එකසිය', 'දෙසිය', 'තුන්සිය', 'හාරසිය', 'පන්සිය', 'හයසිය', 'හත්සිය', 'අටසිය', 'නවසිය'];
const hundredsExact = ['', 'සියය', 'දෙසියය', 'තුන්සියය', 'හාරසියය', 'පන්සියය', 'හයසියය', 'හත්සියය', 'අටසියය', 'නවසියය'];

// For thousands, 1 = එක්, 2 = දෙ, 3 = තුන්, 4 = හතර, 5 = පන්, 6 = හය, 7 = හත්, 8 = අට, 9 = නව
const thousandsPrefixWords = ['', 'එක්', 'දෙ', 'තුන්', 'හාර', 'පන්', 'හය', 'හත්', 'අට', 'නව'];

function getBelow100(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    if (rem === 0) return tensExact[ten];
    return tensPrefix[ten] + ' ' + ones[rem];
}

function getBelow100ForPrefix(n) {
    if (n === 0) return '';
    if (n < 10) return thousandsPrefixWords[n]; // For thousands prefix
    if (n < 20) return teens[n - 10]; // 10,000 -> දසදහස. 11,000 -> එකොළොස් දහස (actually it's එකොළොස්. Let's just use getBelow100 for >9, except replace ending if needed).
    
    // Simple way:
    // If it's a multiple of 10 like 70 -> "හැත්තෑ". 75 -> "හැත්තෑ පන්".
    const ten = Math.floor(n / 10);
    const rem = n % 10;
    if (rem === 0) {
        // e.g. 70 -> හැත්තෑ
        return tensPrefix[ten];
    }
    return tensPrefix[ten] + ' ' + thousandsPrefixWords[rem];
}

function getBelow1000(n) {
    if (n < 100) return getBelow100(n);
    const hundred = Math.floor(n / 100);
    const rem = n % 100;
    if (rem === 0) return hundredsExact[hundred];
    return hundredsPrefix[hundred] + ' ' + getBelow100(rem);
}

function toSinhalaWords(num) {
    if (num === 0) return 'බිංදුව';
    
    let words = [];
    
    // Lakshas (100,000)
    let lakshas = Math.floor(num / 100000);
    let remAfterLaksha = num % 100000;
    
    if (lakshas > 0) {
        if (lakshas === 1) {
            words.push(remAfterLaksha === 0 ? 'ලක්ෂය' : 'එක්ලක්ෂ');
        } else {
            words.push('ලක්ෂ ' + getBelow100(lakshas)); // e.g. ලක්ෂ පහ, ලක්ෂ විස්ස
        }
    }
    
    let thousands = Math.floor(remAfterLaksha / 1000);
    let remainder = remAfterLaksha % 1000;
    
    if (thousands > 0) {
        // For exact thousands ending, we use "දහස" (e.g. හැත්තෑ දහස)
        // If there's a remainder, we use "දහස්" (e.g. හැත්තෑ දහස් පන්සියය)
        let tWord = remainder === 0 ? 'දහස' : 'දහස්';
        
        if (thousands === 1) {
            words.push('එක්' + tWord);
        } else if (thousands === 10) {
            words.push('දස' + tWord);
        } else if (thousands < 10) {
            words.push(thousandsPrefixWords[thousands] + tWord);
        } else {
            // > 10. e.g. 70 -> හැත්තෑ
            words.push(getBelow100ForPrefix(thousands) + tWord);
        }
    }
    
    if (remainder > 0) {
        words.push(getBelow1000(remainder));
    }
    
    return words.join(' ').replace(/\s+/g, ' ').trim();
}

console.log(70000, "->", toSinhalaWords(70000));
console.log(75000, "->", toSinhalaWords(75000));
console.log(75500, "->", toSinhalaWords(75500));
console.log(100000, "->", toSinhalaWords(100000));
console.log(150000, "->", toSinhalaWords(150000));
console.log(1000000, "->", toSinhalaWords(1000000));
