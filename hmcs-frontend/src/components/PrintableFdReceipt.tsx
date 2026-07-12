import React, { useState, useEffect, forwardRef } from 'react';
import logo from '../assets/logo.jpg';
import { useTenantInfo } from '../hooks/useTenantInfo';
import { getSinhalaAmountInWords } from '../utils/sinhalaNumberWords';

interface PrintableFdReceiptProps {
  fdData: any;
  memberName: string;
}

const PrintableFdReceipt = forwardRef<HTMLDivElement, PrintableFdReceiptProps>(({ fdData, memberName }, ref) => {
  const { societyNameSi } = useTenantInfo();
  
  const [data, setData] = useState({
    receiptNo: '',
    fdNumber: '',
    date: '',
    maturityDate: '',
    principal: '',
    interestRate: '',
    startDate: '',
    endDate: '',
    memberName: '',
    instructionText: '',
    amountInWords: '',
    payoutMethod: ''
  });

  useEffect(() => {
    let dateStr = fdData?.openedDate || fdData?.createdAt;
    let dateObj = dateStr ? new Date(dateStr) : new Date();
    const defaultDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    
    const principalStr = fdData?.principalAmount ? parseFloat(fdData.principalAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '';
    
    setData({
      receiptNo: fdData?.receiptNumber || '',
      fdNumber: fdData?.fdNumber || '',
      date: defaultDate,
      maturityDate: fdData?.maturityDate || '',
      principal: principalStr,
      interestRate: fdData?.interestRate?.toString() ?? '',
      startDate: defaultDate,
      endDate: fdData?.maturityDate || '',
      memberName: memberName || '',
      instructionText: fdData?.maturityInstruction === 'REINVEST_PRINCIPAL_AND_INTEREST' ? '1. මුල් මුදල සහ පොළිය නැවත ආයෝජනය කිරීම' : fdData?.maturityInstruction === 'REINVEST_PRINCIPAL_PAY_INTEREST' ? '2. මුල් මුදල නැවත ආයෝජනය කර, පොළිය ඉතුරුම් ගිණුමට' : '3. ගිණුම වසා සියලු මුදල් ගෙවීම',
      amountInWords: fdData?.principalAmount ? getSinhalaAmountInWords(parseFloat(fdData.principalAmount)) : '',
      payoutMethod: fdData?.interestPayoutMethod === 'MONTHLY' ? 'මාසිකව' : 'කල් පිරුණම'
    });
  }, [fdData, memberName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div ref={ref} className="w-full bg-white print:m-0 print:p-0" style={{ fontFamily: 'sans-serif' }}>
      
      {/* Container simulating the receipt book page */}
      <div className="flex w-full max-w-[1200px] mx-auto min-h-[450px] bg-[#eef7fa] border border-slate-200 shadow-sm print:border-none print:shadow-none print:max-w-none print:w-full overflow-hidden">
        
        {/* LEFT SECTION - Counterfoil */}
        <div className="w-[28%] border-r-[2px] border-dashed border-slate-300 p-8 flex flex-col justify-between bg-[#f6fbfd] print:bg-[#eef7fa] relative">
          
          <div className="space-y-6 flex-grow">
            <div>
              <p className="text-sm font-bold text-slate-800 mb-2">සහතිකය ලබා ගත්තා අය</p>
              <div className="border-b-[1.5px] border-dotted border-slate-600 pb-1 h-7 flex items-end">
                <input type="text" name="memberName" value={data.memberName} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-900 px-2 p-0 focus:ring-0 focus:bg-yellow-50/50" />
              </div>
              <div className="border-b-[1.5px] border-dotted border-slate-600 mt-4 h-5"></div>
              <div className="border-b-[1.5px] border-dotted border-slate-600 mt-4 h-5"></div>
            </div>

            <div className="mt-8">
              <div className="flex justify-between items-end border-b-[1.5px] border-dotted border-slate-600 pb-1 relative">
                <span className="text-sm font-bold text-slate-800 bg-[#f6fbfd] pr-2 absolute left-0 bottom-0 pointer-events-none">අනුක්‍රමික අංකය</span>
                <input type="text" name="receiptNo" value={data.receiptNo} onChange={handleChange} className="w-full bg-transparent border-none outline-none text-2xl font-bold text-red-600 tracking-wider text-right p-0 focus:ring-0 focus:bg-yellow-50/50" />
              </div>

              <div className="flex justify-between items-end border-b-[1.5px] border-dotted border-slate-600 pb-1 mt-5 relative">
                <span className="text-sm font-bold text-slate-800 bg-[#f6fbfd] pr-2 absolute left-0 bottom-0 pointer-events-none">දිනය</span>
                <input type="text" name="date" value={data.date} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-sm text-right p-0 focus:ring-0 focus:bg-yellow-50/50" />
              </div>

              <div className="flex justify-between items-end border-b-[1.5px] border-dotted border-slate-600 pb-1 mt-5 relative">
                <span className="text-sm font-bold text-slate-800 bg-[#f6fbfd] pr-2 absolute left-0 bottom-0 pointer-events-none">කල් පිරෙන දිනය</span>
                <input type="text" name="maturityDate" value={data.maturityDate} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-sm text-right p-0 focus:ring-0 focus:bg-yellow-50/50" />
              </div>

              <div className="flex justify-between items-end border-b-[1.5px] border-dotted border-slate-600 pb-1 mt-5 relative">
                <span className="text-sm font-bold text-slate-800 bg-[#f6fbfd] pr-2 absolute left-0 bottom-0 pointer-events-none">මුදල</span>
                <input type="text" name="principal" value={data.principal} onChange={handleChange} className="w-full bg-transparent border-none outline-none font-bold text-right p-0 focus:ring-0 focus:bg-yellow-50/50" />
              </div>

              <div className="mt-5">
                <p className="text-sm font-bold text-slate-800 mb-2 bg-[#f6fbfd] pr-2 inline-block relative z-10 pointer-events-none">සහතිකය දීර්ඝ කිරීම පිළිබඳ විස්තර</p>
                <div className="relative">
                  <textarea 
                    name="instructionText" 
                    value={data.instructionText} 
                    onChange={handleChange} 
                    className="absolute left-6 top-[6px] w-[calc(100%-24px)] h-full bg-transparent border-none outline-none text-[10px] font-bold text-slate-800 p-0 focus:ring-0 focus:bg-yellow-50/50 z-20 resize-none leading-[32px] overflow-hidden" 
                  />
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <div key={num} className="flex items-end border-b-[1.5px] border-dotted border-slate-600 h-[32px] relative pointer-events-none">
                      <span className="text-xs font-bold text-slate-600 bg-[#f6fbfd] pr-2 absolute left-0 bottom-[-2px]">{num}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* RIGHT SECTION - Main Receipt */}
        <div className="w-[72%] p-6 relative flex flex-col bg-[#eef7fa]">
          
          {/* Outer triple border */}
          <div className="border-4 border-slate-800 rounded-xl p-1 h-full relative">
            <div className="border border-slate-800 rounded-lg p-1 h-full">
              <div className="border-[1.5px] border-slate-800 rounded-md p-6 h-full flex flex-col relative z-10">
                
                {/* Watermark Logo Placeholder */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 opacity-[0.05] pointer-events-none">
                  <img src={logo} alt="Background Logo" className="w-[400px] h-[400px] rounded-full object-cover mix-blend-multiply grayscale" />
                </div>

                {/* Header */}
                <div className="text-center mb-8 pointer-events-none">
                  <div className="flex justify-center items-end gap-2 text-[16px] font-bold text-slate-900 mb-1">
                    <span className="pb-1 text-center font-black text-[22px]">{societyNameSi}</span>
                  </div>
                  <h1 className="text-[30px] font-black text-slate-800 tracking-wider mt-1" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.2), -1px -1px 0px rgba(255,255,255,0.5)' }}>
                    ස්ථිර තැන්පත් කුවිතාන්සිය
                  </h1>
                </div>

                {/* Account & Maturity Boxes */}
                <div className="flex justify-between items-start mb-6 px-4 relative z-20">
                  
                  <div className="flex border-[1.5px] border-slate-800 rounded-sm bg-[#eef7fa]">
                    <div className="border-r-[1.5px] border-slate-800 p-1 px-3 flex flex-col justify-center pointer-events-none">
                      <span className="text-[13px] font-bold leading-tight text-slate-900">ගිණුම්</span>
                      <span className="text-[13px] font-bold leading-tight text-slate-900">අංකය</span>
                    </div>
                    <div className="p-2 min-w-[160px] flex items-center justify-center bg-white/50">
                      <input type="text" name="fdNumber" value={data.fdNumber} onChange={handleChange} className="w-full text-center font-bold text-lg text-slate-900 bg-transparent border-none outline-none p-0 focus:ring-0 focus:bg-yellow-50" />
                    </div>
                  </div>



                  <div className="flex border-[1.5px] border-slate-800 rounded-sm bg-[#eef7fa]">
                    <div className="border-r-[1.5px] border-slate-800 p-1 px-3 flex flex-col justify-center pointer-events-none">
                      <span className="text-[13px] font-bold leading-tight text-slate-900">කල් පිරෙන</span>
                      <span className="text-[13px] font-bold leading-tight text-slate-900">දිනය</span>
                    </div>
                    <div className="p-2 min-w-[160px] flex items-center justify-center bg-white/50">
                      <input type="text" name="maturityDate" value={data.maturityDate} onChange={handleChange} className="w-full text-center font-bold text-lg text-slate-900 bg-transparent border-none outline-none p-0 focus:ring-0 focus:bg-yellow-50" />
                    </div>
                  </div>

                </div>

                <div className="flex justify-between items-end mb-8 px-4 relative z-20">
                  <div className="flex items-end border-b-[1.5px] border-dotted border-slate-600 pb-1 w-[45%]">
                    <span className="font-bold text-sm text-slate-900 pr-2 whitespace-nowrap pointer-events-none">අනුක්‍රමික අංකය</span>
                    <input type="text" name="receiptNo" value={data.receiptNo} onChange={handleChange} className="flex-grow bg-transparent border-none outline-none text-2xl font-bold text-red-600 tracking-widest p-0 focus:ring-0 focus:bg-yellow-50/50" />
                  </div>
                  <div className="flex items-end border-b-[1.5px] border-dotted border-slate-600 pb-1 w-[40%]">
                    <span className="font-bold text-sm text-slate-900 pr-2 whitespace-nowrap pointer-events-none">දිනය</span>
                    <input type="text" name="date" value={data.date} onChange={handleChange} className="flex-grow bg-transparent border-none outline-none font-bold text-slate-900 text-center p-0 focus:ring-0 focus:bg-yellow-50/50" />
                  </div>
                </div>

                {/* Paragraphs */}
                <div className="px-4 flex-grow relative z-20">
                  <div className="text-[14px] font-bold text-slate-900 leading-[3.2] text-left">
                    <span className="border-b-[1.5px] border-dotted border-slate-600 w-24 inline-block mx-1">
                      <input type="text" name="startDate" value={data.startDate} onChange={handleChange} className="w-full bg-transparent border-none outline-none text-center font-bold p-0 focus:ring-0" />
                    </span>
                    සිට
                    <span className="border-b-[1.5px] border-dotted border-slate-600 w-24 inline-block mx-2">
                      <input type="text" name="endDate" value={data.endDate} onChange={handleChange} className="w-full bg-transparent border-none outline-none text-center font-bold p-0 focus:ring-0" />
                    </span>
                    දක්වා කාලය සඳහා වර්ෂයට සියයට
                    <span className="border-b-[1.5px] border-dotted border-slate-600 w-24 inline-block mx-2">
                      <input type="text" name="interestRate" value={data.interestRate} onChange={handleChange} className="w-full bg-transparent border-none outline-none text-center font-bold p-0 focus:ring-0" />
                    </span>
                    ( <span className="border-b-[1.5px] border-dotted border-slate-600 w-24 inline-block text-center">
                      <input type="text" name="payoutMethod" value={data.payoutMethod} onChange={handleChange} className="w-full bg-transparent border-none outline-none text-center font-bold p-0 focus:ring-0" />
                    </span> )
                    බැගින් පොලී ගෙවීමේ පදනම මත 
                    <span className="border-b-[1.5px] border-dotted border-slate-600 min-w-[200px] inline-block mx-2">
                      <input type="text" name="memberName" value={data.memberName} onChange={handleChange} className="w-full bg-transparent border-none outline-none text-center font-bold text-slate-900 p-0 focus:ring-0" />
                    </span>
                    මයා/මිය/මෙනවිය ගෙන් කල් පිරුණු පසු ආපසු ලබාගන්නා / ස්වයංක්‍රීයව දීර්ඝ වන | ස්ථිර තැන්පත් මුදලක් වශයෙන් රුපියල්
                    <span className="border-b-[1.5px] border-dotted border-slate-600 min-w-[250px] inline-block mx-2">
                      <input type="text" name="amountInWords" value={data.amountInWords} onChange={handleChange} placeholder="අකුරෙන් මුදල ලියන්න..." className="w-full bg-transparent border-none outline-none text-center font-bold text-slate-900 p-0 placeholder:font-normal placeholder:text-slate-400 focus:ring-0" />
                    </span>
                    භාරගත් බව සහතික කරමු.
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex justify-between items-end mt-10 px-4 relative z-20">
                  
                  <div className="flex flex-col items-center">
                    <div className="border-[1.5px] border-slate-800 bg-[#eef7fa] px-2 py-3 min-w-[200px] flex items-end">
                      <span className="font-bold text-lg mr-2 pointer-events-none">රු.</span>
                      <span className="border-b-[1.5px] border-dotted border-slate-600 flex-grow inline-block">
                        <input type="text" name="principal" value={data.principal} onChange={handleChange} className="w-full bg-transparent border-none outline-none text-center font-bold text-lg tracking-wide p-0 focus:ring-0 focus:bg-yellow-50/50" />
                      </span>
                    </div>
                    
                    <div className="text-center mt-6 pointer-events-none">
                      <p className="text-[11px] font-bold text-slate-800 leading-tight">(අන්සතු කළ නොහැක)</p>
                      <p className="text-[11px] font-bold text-slate-800 leading-tight mt-1">කල් පිරීමේ දී මෙම කුවිතාන්සිය<br/>ඉදිරිපත් කළ යුතුයි.</p>
                    </div>
                  </div>

                  {/* Red Seal */}
                  <div className="absolute right-[15%] bottom-16 flex flex-col items-center z-30 pointer-events-none opacity-80 mix-blend-multiply">
                    <div className="w-20 h-20 bg-[#ff2a00] flex items-center justify-center shadow-sm" style={{ clipPath: 'polygon(50% 0%, 61% 5%, 72% 0%, 79% 9%, 91% 8%, 93% 19%, 100% 25%, 97% 36%, 100% 46%, 93% 54%, 96% 65%, 86% 71%, 84% 82%, 73% 85%, 67% 95%, 55% 94%, 46% 100%, 35% 95%, 26% 100%, 19% 90%, 8% 89%, 6% 78%, 0% 68%, 5% 57%, 0% 46%, 4% 35%, 0% 25%, 9% 17%, 9% 6%, 21% 7%, 30% 0%, 40% 5%)' }}>
                    </div>
                  </div>

                  <div className="flex gap-12 mb-6 pointer-events-none">
                    <div className="text-center flex flex-col items-center">
                      <div className="border-b-[1.5px] border-dotted border-slate-800 w-36 mb-2"></div>
                      <span className="text-[12px] font-bold text-slate-900">කළමනාකාර / ලේකම්</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                      <div className="border-b-[1.5px] border-dotted border-slate-800 w-36 mb-2"></div>
                      <span className="text-[12px] font-bold text-slate-900">සභාපති</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

export default PrintableFdReceipt;
