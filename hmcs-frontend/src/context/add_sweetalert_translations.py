import json
import re

file_path = "c:/Users/USER/OneDrive - itum.mrt.ac.lk/Desktop/Hikkaduwa bank/hmcs-frontend/src/context/LanguageContext.tsx"

new_translations = {
    'Are you sure?': {
        'en': 'Are you sure?',
        'si': 'ඔබට විශ්වාසද?',
        'ta': 'நீங்கள் உறுதியாக இருக்கிறீர்களா?'
    },
    'You want to mark this comment as resolved?': {
        'en': 'You want to mark this comment as resolved?',
        'si': 'ඔබට මෙම සටහන විසඳුවා ලෙස සලකුණු කිරීමට අවශ්‍යද?',
        'ta': 'இந்தக் கருத்தைத் தீர்க்கப்பட்டதாகக் குறிக்க விரும்புகிறீர்களா?'
    },
    'Yes, mark as resolved': {
        'en': 'Yes, mark as resolved',
        'si': 'ඔව්, සලකුණු කරන්න',
        'ta': 'ஆம், குறிக்கவும்'
    },
    'Resolved!': {
        'en': 'Resolved!',
        'si': 'විසඳුවා!',
        'ta': 'தீர்க்கப்பட்டது!'
    },
    'Comment successfully marked as resolved!': {
        'en': 'Comment successfully marked as resolved!',
        'si': 'සටහන සාර්ථකව විසඳුවා ලෙස සලකුණු කරන ලදී!',
        'ta': 'கருத்து வெற்றிகரமாகத் தீர்க்கப்பட்டதாகக் குறிக்கப்பட்டது!'
    },
    'Error!': {
        'en': 'Error!',
        'si': 'දෝෂයක්!',
        'ta': 'பிழை!'
    },
    'Failed to resolve comment. Please try again.': {
        'en': 'Failed to resolve comment. Please try again.',
        'si': 'සටහන විසඳුවා ලෙස සලකුණු කිරීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.',
        'ta': 'கருத்தைத் தீர்ப்பதில் தோல்வி. மீண்டும் முயற்சிக்கவும்.'
    },
    'Cancel': {
        'en': 'Cancel',
        'si': 'අවලංගු කරන්න',
        'ta': 'ரத்துசெய்'
    }
}

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the closing brace of the translations object
# The translations object is defined as: const translations: Translations = { ... };

# We'll insert before the closing brace of the translations dictionary.
# Let's find "const translations: Translations = {" and the closing "};"
start_idx = content.find("const translations: Translations = {")
if start_idx != -1:
    end_idx = content.find("};", start_idx)
    
    # We will build the new fields string
    fields = ""
    for k, v in new_translations.items():
        if f"'{k}':" not in content and f'"{k}":' not in content:
            fields += f"  '{k}': {{\n    en: '{v['en']}',\n    si: '{v['si']}',\n    ta: '{v['ta']}'\n  }},\n"
            
    if fields:
        # Insert right before end_idx
        # But wait, end_idx might be just "};", let's find the newline before it
        insert_idx = content.rfind("\n", start_idx, end_idx) + 1
        new_content = content[:insert_idx] + fields + content[insert_idx:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully added new translations.")
    else:
        print("Translations already exist.")
else:
    print("Could not find translations dictionary.")
