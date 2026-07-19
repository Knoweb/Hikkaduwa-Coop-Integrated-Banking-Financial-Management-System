import os

path = r'hmcs-frontend\src\context\LanguageContext.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

translations = """
  'SaaS Administration Panel': { en: 'SaaS Administration Panel', si: 'SaaS ??????? ??????' },
  'HMCS Bank': { en: 'HMCS Bank', si: 'HMCS ??????' },
  'Branches': { en: 'Branches', si: '????' },
  'Managing All Organizations': { en: 'Managing All Organizations', si: '?????? ??????? ?????????' },
"""

content = content.replace("export const translations: Record<string, { en: string; si: string }> = {", f"export const translations: Record<string, {{ en: string; si: string }}> = {{{translations}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated LanguageContext.tsx')
