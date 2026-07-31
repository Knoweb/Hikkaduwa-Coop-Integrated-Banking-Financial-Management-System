import React, { forwardRef } from 'react';
import { useTenantInfo } from '../hooks/useTenantInfo';
import { getBranchName } from '../pages/BranchDashboard';

export interface NoticeLetterProps {
  noticeType: 1 | 2 | 3 | 4 | 5; // 1: 1st, 2: 2nd, 3: 3rd (Guarantors), 4: 4th (Registered), 5: 5th (Red Notice)
  loan: any;
  member?: any;
  memberName?: string;
  guarantors?: any[];
  overdueAmount?: number;
  totalDue?: number;
  dueDate?: string;
  noticeDate?: string;
}

export const PrintableNoticeLetter = forwardRef<HTMLDivElement, NoticeLetterProps>(({
  noticeType,
  loan,
  member,
  memberName: memberNameProp,
  guarantors = [],
  overdueAmount = 0,
  totalDue = 0,
  dueDate = new Date().toLocaleDateString('en-CA'),
  noticeDate = new Date().toLocaleDateString('en-CA'),
}, ref) => {
  const tenantInfo = useTenantInfo() as any;
  const societyNameSi = tenantInfo?.societyNameSi || 'හික්කඩුව විවිධ සේවා සමූපාකාර සමිතිය';
  const addressSi = tenantInfo?.addressSi || 'හික්කඩුව';
  const telephone = tenantInfo?.telephone || '091-2277255';

  const formattedNoticeDate = noticeDate || new Date().toLocaleDateString('en-CA');
  const formattedDueDate = dueDate || new Date().toLocaleDateString('en-CA');

  const ad = typeof loan?.applicationData === 'string' ? JSON.parse(loan.applicationData || '{}') : (loan?.applicationData || {});
  
  const cleanText = (txt: any) => {
    if (!txt || typeof txt !== 'string') return '';
    const trimmed = txt.trim();
    if (trimmed.match(/^\.+$/)) return '';
    return trimmed;
  };

  const extractedMemberName = cleanText(memberNameProp) || cleanText(member?.fullNameSinhala) || cleanText(member?.fullName) || cleanText(member?.nameWithInitials) || cleanText(ad?.applicantName) || cleanText(ad?.name) || cleanText(ad?.fullName) || '';
  const extractedMemberAddress = cleanText(member?.address) || cleanText(ad?.address) || cleanText(ad?.applicantAddress) || '';
  
  const branchMapSi: Record<number, string> = {
    1: 'හික්කඩුව',
    2: 'දොඩන්දූව',
    3: 'රත්ගම',
    4: 'සීනිගම',
    5: 'තිරාණගම',
    6: 'පෙරලිය',
    7: 'කලුපේ',
    8: 'ගෝනාපීනුවල',
    9: 'බද්දේගම',
    10: 'සන්දරවල',
    11: 'ගාල්ල'
  };
  const branchNameStr = branchMapSi[loan?.branchId || 1] || 'හික්කඩුව';
  const loanNumber = loan?.accountNumber || loan?.loanNumber || loan?.loanId || '....................';
  const requestedAmount = loan?.requestedAmount ? Number(loan.requestedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '....................';
  const arrearsAmountStr = '........................';

  const g1 = guarantors[0] ? (guarantors[0].fullNameSinhala || guarantors[0].fullName || guarantors[0].nameWithInitials) : '........................................................';
  const g1Address = guarantors[0]?.address || '........................................................';
  const g2 = guarantors[1] ? (guarantors[1].fullNameSinhala || guarantors[1].fullName || guarantors[1].nameWithInitials) : '........................................................';
  const g2Address = guarantors[1]?.address || '........................................................';

  return (
    <div className="space-y-2">
      {/* Interactive Helper Notice Banner for user */}
      <div className="print:hidden bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm">
        <span>💡</span>
        <span>ලිපියේ ඕනෑම ස්ථානයක් මත Click කර (නම, ලිපිනය, බැංකුව, දින, මුදල් ආදිය) ඔබට අවශ්‍ය පරිදි Edit කර මුද්‍රණය කළ හැක.</span>
      </div>

      <div 
        ref={ref} 
        contentEditable={true}
        suppressContentEditableWarning={true}
        className="p-10 bg-white text-black font-serif text-sm leading-relaxed max-w-[800px] mx-auto print:p-8 print:max-w-none focus:outline-none focus:ring-1 focus:ring-amber-400 rounded-lg"
      >
        
        {/* ── LETTER 1: ණය කරු වෙත යවනු ලබන පළමු වෙනි ලිපිය (Job 1675) ── */}
        {noticeType === 1 && (
          <div className="space-y-6 text-justify">
            {/* Exactly matches the original paper header */}
            <div className="flex justify-between items-end border-b-0 pb-1 mt-4">
              <span className="underline font-bold text-base">ණය කරුවෙත යවනු ලබන පළමුවැනි ලිපිය</span>
              <span className="text-sm">දිනය: <span className="font-bold">{formattedNoticeDate}</span></span>
            </div>

            <div className="pt-4 text-base space-y-1.5 max-w-[480px]">
              <div className="flex items-end gap-1">
                <span className="flex-grow pb-0.5 min-h-[24px] font-bold focus:outline-none border-b-2 border-dotted border-black/80">
                  {extractedMemberName}
                </span>
                <span className="whitespace-nowrap pb-0.5">මයා / මිය,</span>
              </div>
              <div className="pb-0.5 min-h-[24px] focus:outline-none border-b-2 border-dotted border-black/80">
                {extractedMemberAddress}
              </div>
              <div className="pb-0.5 min-h-[24px] focus:outline-none border-b-2 border-dotted border-black/80"></div>
            </div>

            <p className="pt-2 font-bold">මහත්මයාණෙනි / මහත්මියනි,</p>

            <div className="border-b border-dotted border-black/60 pb-1 text-center font-bold text-base">
              රු: <span className="underline px-2">{requestedAmount}</span> ක ණය මුදල - ණය අංක: {loanNumber}
            </div>

            <p className="indent-8">
              ඔබ විසින් මෙම සමිතියේ <strong>{branchNameStr}</strong> ග්‍රාමීය බැංකුවෙන් <strong>........................</strong> දින ලබාගෙන ඇති රු. <strong>{requestedAmount}</strong> ක ණය මුදලේ නියමිත වාරික මසපතා නොගෙවීම නිසා අද දිනට රු. <strong>{arrearsAmountStr}</strong> ක හිඟ ශේෂයක්ද, මෙයට අමතරව <strong>........................</strong> දින සිට රු. <strong>........................</strong> පොලියද අයවිය යුතුව ඇත. එබැවින් කරුණාකර <strong>........................</strong> දිනට පෙර මෙම හිඟ මුදල හා පොලියද ග්‍රාමීය බැංකුවේ තැන්පත් කරන ලෙස ඔබට මෙයින් මතක් කරමි.
            </p>

            <p className="indent-8">
              මෙම හිඟ මුදල ඉහත සඳහන් දිනට පෙර ඔබ විසින් නොගෙවුව හොත්, ඊළඟ මාසය වන විට වාරිකයක් එකතුව හිඟ මුදල තවත් වැඩිවන බැවින් මෙම ගෙවීම තවත් අපහසු වනු ඇත. එබැවින් කරුණාකර ඉහත දිනට පෙර මෙම හිඟ මුදල හා පොලිය ගෙවා ණය මුදල යථා තත්වයට පත්කර ගන්නා ලෙසට නැවත වරක් මතක් කරමි.
            </p>

            <div className="pt-10 flex justify-between items-end">
              <div>
                <p>මෙයට - විශ්වාසි වූ,</p>
                <br /><br />
                <p className="border-t border-black pt-1 font-bold w-48 text-center">කළමනාකරු</p>
              </div>
              <div className="text-xs text-gray-500">Job-1675</div>
            </div>
          </div>
        )}

        {/* ── LETTER 2: ණය කරු වෙත යවනු ලබන දෙවැනි ලිපිය (Job 1551) ── */}
        {noticeType === 2 && (
          <div className="space-y-6 text-justify">
            <div className="border-b-2 border-black pb-3 text-center space-y-1">
              <h2 className="text-xl font-bold uppercase">{societyNameSi}</h2>
              <p className="text-xs">{addressSi} | දුරකථන: {telephone}</p>
              <h3 className="text-base font-bold underline mt-2">ණයකරු වෙත යවනු ලබන දෙවැන්න ලිපිය</h3>
            </div>

            <div className="flex justify-between items-start pt-2">
              <div>
                <p className="font-bold">{extractedMemberName}</p>
                <p className="text-xs">{extractedMemberAddress}</p>
              </div>
              <div className="text-right text-xs">
                <p>දිනය: <span className="font-bold">{formattedNoticeDate}</span></p>
              </div>
            </div>

            <p className="pt-2 font-bold">මහත්මයාණෙනි / මහත්මියනි,</p>

            <p className="text-center font-bold text-base border-y border-dashed border-gray-400 py-1 uppercase">
              හිඟ වාරික මුදල් - ණය අංක: {loanNumber}
            </p>

            <p className="indent-8">
              <strong>........................</strong> දින දරණ රු. <strong>{requestedAmount}</strong> දරන ඔබට ප්‍රදානය කරන ලද ණය මුදල වෙනුවෙන් අද දිනට තවම අප වෙත ලැබිය යුතු රු. <strong>{arrearsAmountStr}</strong> ක හිඟ වාරිකයන් මෙතෙක් ගෙවා නොමැති බව දන්වා සිටිමු.
            </p>

            <p className="indent-8">
              මේ වෙනුවෙන් ඔහු / ඇය වෙත අප විසින් දෙවරක් දන්වා යවන ලද නමුත් ණය වාරික වෙනුවෙන් මෙතෙක් මුදල් තැන්පත් කොට නොමැත.
            </p>

            <p className="indent-8">
              නොපමාව හිඟ වාරිකයන් සියල්ල ගෙවා ඉන්පසු නිසි පරිදි වාරික මුදල් ගෙවන ලෙසට ණයකරු උනන්දු කරවන මෙන් කරුණාවෙන් ඉල්ලා සිටිමු.
            </p>

            <div className="pt-10 flex justify-between items-end">
              <div>
                <p>මෙයට - විශ්වාසි වූ,</p>
                <br /><br />
                <p className="border-t border-black pt-1 font-bold w-48 text-center">කළමනාකරු</p>
              </div>
              <div className="text-xs text-gray-500">Job-1551</div>
            </div>
          </div>
        )}

        {/* ── LETTER 3: ඇපකරුවන් වෙත යවනු ලබන අත්වැල ලිපිය (Job 1019) ── */}
        {noticeType === 3 && (
          <div className="space-y-6 text-justify">
            <div className="border-b-2 border-black pb-3 text-center space-y-1">
              <h2 className="text-xl font-bold uppercase">{societyNameSi}</h2>
              <p className="text-xs">{addressSi} | දුරකථන: {telephone}</p>
              <h3 className="text-base font-bold underline mt-2">ණයකරු වෙත පිටපත් සහිතව ඇපකරුවන් වෙත යවනු ලබන අත්වැල ලිපිය</h3>
            </div>

            <div className="flex justify-between items-start pt-2 text-xs">
              <div className="space-y-2">
                <p><strong>I ඇපකරු:</strong> {g1} <br /> {g1Address}</p>
                <p><strong>II ඇපකරු:</strong> {g2} <br /> {g2Address}</p>
              </div>
              <div className="text-right">
                <p>දිනය: <span className="font-bold">{formattedNoticeDate}</span></p>
              </div>
            </div>

            <p className="pt-2 font-bold">මහත්මයාණෙනි / මහත්මියනි,</p>

            <p className="indent-8 font-bold text-center border-y border-dashed border-gray-400 py-1">
              {extractedMemberName} මහතා/මහත්මියගේ රු. {requestedAmount} ක ණය මුදල - ණය අංක: {loanNumber}
            </p>

            <p className="indent-8">
              ඔබ විසින් ඇප වී සිටින <strong>{extractedMemberName}</strong> මහතාට/මහත්මියට අනුමත කරන ලද ණය මුදල වෙනුවෙන් දිනට ගෙවිය යුතු වූ රූපියල් <strong>{arrearsAmountStr}</strong> ක වාරිකයන් මෙතෙක් ගෙවා නොමැති බව දන්වා සිටිමු.
            </p>

            <p className="indent-8">
              මේ වෙනුවෙන් ඔහු / ඇය වෙත අප විසින් දෙවරක් දන්වා යවන ලද නමුත් ණය වාරික වෙනුවෙන් මෙතෙක් මුදල් තැන්පත් කොට නොමැත.
            </p>

            <p className="indent-8">
              නොපමාව හිඟ වාරිකයන් සියල්ල ගෙවා ඉන්පසු නිසි පරිදි වාරික මුදල් ගෙවන ලෙසට ණයකරු උනන්දු කරවන මෙන් කරුණාවෙන් ඉල්ලා සිටිමු.
            </p>

            <div className="pt-8 flex justify-between items-end">
              <div>
                <p>මෙයට - විශ්වාසි වූ,</p>
                <br /><br />
                <p className="border-t border-black pt-1 font-bold w-48 text-center">කළමනාකරු</p>
                <div className="mt-4 text-xs space-y-1 border-t border-gray-300 pt-2">
                  <p><strong>පිටපත්:</strong></p>
                  <p>ණයකරු: {extractedMemberName}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Job-1019</div>
            </div>
          </div>
        )}

        {/* ── LETTER 4: ලියාපදිංචි තැපෑලෙන් සතරවැනි ලිපිය (Job 1020) ── */}
        {noticeType === 4 && (
          <div className="space-y-6 text-justify">
            <div className="border-b-2 border-black pb-3 text-center space-y-1">
              <h2 className="text-xl font-bold uppercase">{societyNameSi}</h2>
              <p className="text-xs">{addressSi} | දුරකථන: {telephone}</p>
              <p className="text-xs font-bold border border-black inline-block px-2 py-0.5 mt-1">ලියාපදිංචි තැපෑලෙන්</p>
              <h3 className="text-base font-bold underline mt-1">ණයකරු වෙත පිටපතක් සහිතව ඇපකරුවන් වෙත යවනු ලබන සතරවැන්න ලිපිය</h3>
            </div>

            <div className="flex justify-between items-start pt-2 text-xs">
              <div className="space-y-2">
                <p><strong>I ඇපකරු:</strong> {g1} <br /> {g1Address}</p>
                <p><strong>II ඇපකරු:</strong> {g2} <br /> {g2Address}</p>
              </div>
              <div className="text-right">
                <p>දිනය: <span className="font-bold">{formattedNoticeDate}</span></p>
              </div>
            </div>

            <p className="pt-2 font-bold">ප්‍රිය මහත්මයාණෙනි / මහත්මියනි,</p>

            <p className="indent-8 font-bold text-center border-y border-dashed border-gray-400 py-1">
              {extractedMemberName} මහතා/මහත්මියගේ රු. {requestedAmount} ක ණය මුදල - ණය අංක: {loanNumber}
            </p>

            <p className="indent-8">
              අපගේ <strong>........................</strong> දින දරණ ලිපියට වැඩිදුරටත් සම්බන්ධවයි. යථෝක්ත ණය මුදල වෙනුවෙන් හිඟව ඇති වාරිකයන් ගෙවීමට ඔබ හෝ ණය කරු කිසිදු ප්‍රයත්නයක් නොගෙන ඇති බව කණගාටුවෙන් දන්වා සිටින අතර <strong>........................</strong> දිනට පෙර රු. <strong>{arrearsAmountStr}</strong> ක හිඟවාර මුදල් ගෙවන ලෙස ඔබගෙන් ඉල්ලා සිටිමු.
            </p>

            <p className="indent-8">
              මෙදිනට පෙර හිඟ වාර මුදල් ගෙවීමට සුදුසු පියවරක් ඔබ විසින් නොගත හොත් හිඟ මුදල් අයකර ගැනීමට නීති මගින් කටයුතු කරන බව දන්වා සිටිමු.
            </p>

            <div className="pt-8 flex justify-between items-end">
              <div>
                <p>මෙයට - විශ්වාසි වූ,</p>
                <br /><br />
                <p className="border-t border-black pt-1 font-bold w-48 text-center">කළමනාකරු</p>
                <div className="mt-4 text-xs space-y-1 border-t border-gray-300 pt-2">
                  <p><strong>පිටපත්:</strong></p>
                  <p>ණයකරු: {extractedMemberName}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">Job-1020</div>
            </div>
          </div>
        )}

        {/* ── LETTER 5: අවසන් රතු ලිපිය (Red Notice / Job 1018) ── */}
        {noticeType === 5 && (
          <div className="space-y-5 text-justify text-red-700 border-4 border-red-600 p-6 rounded-lg bg-red-50/20">
            <div className="border-b-2 border-red-600 pb-3 text-center space-y-1">
              <h2 className="text-xl font-black uppercase text-red-700">{societyNameSi}</h2>
              <p className="text-xs text-red-600">{addressSi} | දුරකථන: {telephone}</p>
              <p className="text-xs font-bold bg-red-600 text-white inline-block px-3 py-1 mt-1 uppercase tracking-wider">ලියාපදිංචි තැපෑලෙන් / අවසන් රතු නිවේදනය</p>
              <h3 className="text-base font-bold underline mt-1 text-red-800">ඇපකරුවන්ගෙන් හිඟයක් අයකරගැනීමට පෙර යවන අවසන් නිවේදන ලිපිය</h3>
            </div>

            <div className="flex justify-between items-start pt-2 text-xs text-red-800">
              <div>
                <p><strong>ණයකරු:</strong> {extractedMemberName} - {extractedMemberAddress}</p>
              </div>
              <div className="text-right">
                <p>දිනය: <span className="font-bold">{formattedNoticeDate}</span></p>
              </div>
            </div>

            <p className="pt-1 font-bold text-red-900">ප්‍රිය මහත්මයාණෙනි / මහත්මියනි,</p>

            <p className="text-center font-black text-lg border-y-2 border-red-600 py-1 text-red-800">
              රු. {requestedAmount} ක ණය මුදල - ණය අංක: {loanNumber}
            </p>

            <p className="indent-8 font-medium">
              ඉහත සඳහන් ණය මුදල වෙනුවෙන් <strong>........................</strong> දිනට මෙතෙක් ඇති රු. <strong>{arrearsAmountStr}</strong> ක වාරිකයන් ගෙවීම ඔබ විසින් පැහැර හැර ඇති බව කනගාටුවෙන් දන්වා සිටිමු. මින් පෙර අවස්ථාවලදී අප විසින් දන්වා ඇතත්, හිඟ වාර මුදල් ගෙවීම සඳහා ඔබ හෝ ඇපකරුවන් කිසිදු උත්සාහයක් නොගැනීම ගැන කනගාටුවන්නෙමු.
            </p>

            <p className="indent-8 font-bold">
              කෙසේ හෝ මේ සම්බන්ධයෙන් සිහි පත් කරනු ලැබීමට ප්‍රථමයෙන් හිඟ වාර මුදල් ගෙවීම සඳහා ඔබට තවත් අවස්ථාවක් ලබාදීමට අප අදහස් කොට ඇත. මේ සම්බන්ධයෙන් සුදුසු වැඩපිළිවෙලක් යොදා ගැනීම සඳහා <strong>........................</strong> දිනට මත්තෙන් පහත අත්සන් කරන අප හමුවන ලෙස ඔබගෙන් ඉල්ලා සිටින අතර, අපගේ මෙම ඉල්ලීම පැහැර හරිනු ලැබුවහොත් තවදුරටත් දැනුම්දීමක් නොමැතිව හිඟ වාරිකයන් අයකර ගැනීම සඳහා නිසි මගින් කටයුතු කිරීමට සිදුවීම අකමැත්තෙන් වුවද අප විසින් ගනු ලබන පියවරක් බව දන්වා සිටිමු.
            </p>

            <div className="pt-6 flex justify-between items-end">
              <div>
                <p className="font-bold">මෙයට - විශ්වාසි වූ,</p>
                <br /><br />
                <p className="border-t-2 border-red-700 pt-1 font-black w-48 text-center text-red-800">කළමනාකරු</p>
                <div className="mt-4 text-xs space-y-1 border-t border-red-300 pt-2 text-red-800">
                  <p><strong>පිටපත් :</strong></p>
                  <p>01. I ඇපකරු: {g1} ({g1Address})</p>
                  <p>02. II ඇපකරු: {g2} ({g2Address})</p>
                </div>
              </div>
              <div className="text-xs font-bold text-red-500">Job-1018</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
});
