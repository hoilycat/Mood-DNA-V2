with open("backend/app/services/ai_consultant.py", "r") as f:
    code = f.read()

helper_new = '''
def extract_json(text):
    import json
    text = text.strip()
    if text.startswith("```json"): text = text[7:]
    if text.startswith("```"): text = text[3:]
    if text.endswith("```"): text = text[:-3]
    try:
        return json.loads(text.strip())
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("FAILED TEXT:", repr(text))
        return {"category": "Error", "advice": "결과 포맷이 올바르지 않습니다: " + text[:100]}
'''

# Find the def extract_json... up to except: ... return {"category"...}
# I will just replace the whole helper.
import re
code = re.sub(r'def extract_json.*?return \{"category": "Error", "advice": "결과 포맷이 올바르지 않습니다: " \+ text\[:100\]\}', helper_new.strip(), code, flags=re.DOTALL)

with open("backend/app/services/ai_consultant.py", "w") as f:
    f.write(code)

