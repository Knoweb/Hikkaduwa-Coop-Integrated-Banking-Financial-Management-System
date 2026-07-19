import json
import os

path = r'C:\Users\USER\.gemini\antigravity\brain\2d81b1e1-a0d8-4a3c-aa87-b6eddbad9847\.system_generated\logs\transcript_full.jsonl'
best_code = ''

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = json.dumps(data)
            if 'function TenantsTab' in content:
                # find the tool call arguments
                if 'tool_calls' in data:
                    for tc in data['tool_calls']:
                        args_str = json.dumps(tc.get('args', {}))
                        if 'function TenantsTab' in args_str:
                            if len(args_str) > len(best_code):
                                best_code = args_str
        except:
            pass

with open('recovered_code.txt', 'w', encoding='utf-8') as f:
    f.write(best_code)
