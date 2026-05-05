with open("backend/app/services/ai_consultant.py", "r") as f:
    code = f.read()

helper_new = '''
def extract_json(text):
    import json
    import re
    text = text.strip()
    match = re.search(r'```(?:json)?(.*?)```', text, re.DOTALL)
    if match:
        text = match.group(1).strip()
    else:
        match = re.search(r'(\{.*\}|\[.*\])', text, re.DOTALL)
        if match:
            text = match.group(1).strip()
    try:
        return json.loads(text, strict=False)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("FAILED TEXT:", repr(text))
        return {"category": "Error", "advice": f"결과 포맷 파싱 에러 ({str(e)}): " + text[:100]}
'''

import re
code = re.sub(r'def extract_json.*?return \{"category": "Error", "advice": "결과 포맷이 올바르지 않습니다: " \+ text\[:100\]\}', helper_new.strip(), code, flags=re.DOTALL)

with open("backend/app/services/ai_consultant.py", "w") as f:
    f.write(code)

