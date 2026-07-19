import json

path = r'C:\Users\USER\.gemini\antigravity\brain\2d81b1e1-a0d8-4a3c-aa87-b6eddbad9847\.system_generated\logs\transcript_full.jsonl'
edits = []

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    args = tc.get('args', {})
                    if 'SystemAdminDashboard.tsx' in str(args.get('TargetFile', '')):
                        if tc['name'] in ['replace_file_content', 'multi_replace_file_content']:
                            edits.append(tc)
        except:
            pass

with open('all_sysadmin_edits.json', 'w', encoding='utf-8') as f:
    json.dump(edits, f, indent=2)
