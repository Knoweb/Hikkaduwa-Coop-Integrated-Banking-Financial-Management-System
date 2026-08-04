import re

file_path = "c:/Users/USER/OneDrive - itum.mrt.ac.lk/Desktop/Hikkaduwa bank/hmcs-frontend/src/context/LanguageContext.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "'Are you sure?': {\n    en: 'Are you sure?',\n    si: 'ඔබට විශ්වාසද?',": "'Are you sure?': {\n    en: 'Are you sure?',\n    si: 'Are you sure? / ඔබට විශ්වාසද?',",
    
    "'You want to mark this comment as resolved?': {\n    en: 'You want to mark this comment as resolved?',\n    si: 'ඔබට මෙම සටහන විසඳුවා ලෙස සලකුණු කිරීමට අවශ්‍යද?',": "'You want to mark this comment as resolved?': {\n    en: 'You want to mark this comment as resolved?',\n    si: 'You want to mark this comment as resolved? / ඔබට මෙම සටහන විසඳුවා ලෙස සලකුණු කිරීමට අවශ්‍යද?',",
    
    "'Yes, mark as resolved': {\n    en: 'Yes, mark as resolved',\n    si: 'ඔව්, සලකුණු කරන්න',": "'Yes, mark as resolved': {\n    en: 'Yes, mark as resolved',\n    si: 'Yes, mark as resolved / ඔව්',",
    
    "'Cancel': {\n    en: 'Cancel',\n    si: 'අවලංගු කරන්න',": "'Cancel': {\n    en: 'Cancel',\n    si: 'Cancel / අවලංගු කරන්න',",
    
    "'Resolved!': {\n    en: 'Resolved!',\n    si: 'විසඳුවා!',": "'Resolved!': {\n    en: 'Resolved!',\n    si: 'Resolved! / විසඳුවා!',",
    
    "'Comment successfully marked as resolved!': {\n    en: 'Comment successfully marked as resolved!',\n    si: 'සටහන සාර්ථකව විසඳුවා ලෙස සලකුණු කරන ලදී!',": "'Comment successfully marked as resolved!': {\n    en: 'Comment successfully marked as resolved!',\n    si: 'Comment successfully marked as resolved! / සටහන සාර්ථකව විසඳුවා ලෙස සලකුණු කරන ලදී!',",
    
    "'Error!': {\n    en: 'Error!',\n    si: 'දෝෂයක්!',": "'Error!': {\n    en: 'Error!',\n    si: 'Error! / දෝෂයක්!',",
    
    "'Failed to resolve comment. Please try again.': {\n    en: 'Failed to resolve comment. Please try again.',\n    si: 'සටහන විසඳුවා ලෙස සලකුණු කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.',": "'Failed to resolve comment. Please try again.': {\n    en: 'Failed to resolve comment. Please try again.',\n    si: 'Failed to resolve comment. / සටහන විසඳුවා ලෙස සලකුණු කිරීමට නොහැකි විය.',"
}

for old_str, new_str in replacements.items():
    content = content.replace(old_str, new_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Sinhala translations to include English.")
