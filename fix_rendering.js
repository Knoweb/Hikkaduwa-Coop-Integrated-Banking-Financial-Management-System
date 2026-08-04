const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `{ad.supportingDocuments.map((d: string, i: number) => (
                  <a key={i} href={d} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm block">{d}</a>
                ))}`;

const replacementStr = `<div className="flex flex-wrap gap-4 mt-2">
                  {ad.supportingDocuments.map((d: string, i: number) => (
                    <div key={i} className="w-32 h-32 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                      {d.startsWith('data:image/') ? (
                        <img src={d} alt={"Attachment " + (i+1)} className="w-full h-full object-cover cursor-pointer" onClick={() => {
                          const win = window.open();
                          if (win) {
                            win.document.write('<img src="' + d + '" style="max-width: 100%; height: auto;" />');
                          }
                        }} />
                      ) : (
                        <a href={d} download={"document-" + (i+1)} className="text-blue-600 font-semibold text-sm underline text-center p-2 block w-full h-full flex flex-col items-center justify-center gap-1">
                          Doc {i+1}
                        </a>
                      )}
                    </div>
                  ))}
                </div>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Replaced successfully');
