import asyncio
from app.services.ai_consultant import compare_designs

import cv2, numpy as np
img1 = cv2.imencode('.jpg', np.ones((100, 100, 3), dtype=np.uint8)*255)[1].tobytes()
img2 = cv2.imencode('.jpg', np.ones((100, 100, 3), dtype=np.uint8)*200)[1].tobytes()

stats1 = {"brightness": 100, "complexity": 10, "saliency": 10, "symmetry": 10, "space": 90, "colors": ["#ffffff"]}
stats2 = {"brightness": 80, "complexity": 15, "saliency": 15, "symmetry": 10, "space": 80, "colors": ["#cccccc"]}
target = {"brightness": 50, "complexity": 50, "saliency": 50, "symmetry": 50, "space": 50}

from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
load_dotenv('../../.env')
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)
prompt = """
        당신은 세계적인 디자인 비평가입니다. 두 개의 디자인 시안(A안, B안)을 비교 분석하여 최적의 선택을 제안하세요.
        [데이터 분석 정보]
        - A안: 밝기 100, 복잡도 10
        - B안: 밝기 80, 복잡도 15
        
        [출력 형식 - JSON]
        {
            "winner": "A 또는 B",
            "summary": "총평",
            "detail_comparison": "상세 비교",
            "reasoning": "선택 이유",
            "suggested_action": "개선 제안"
        }
"""
response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=[prompt],
    config=types.GenerateContentConfig(response_mime_type="application/json")
)

text = response.text
print("RAW TEXT:")
print(repr(text))
try:
    import json
    text2 = text.strip()
    if text2.startswith("```json"): text2 = text2[7:]
    if text2.startswith("```"): text2 = text2[3:]
    if text2.endswith("```"): text2 = text2[:-3]
    res = json.loads(text2.strip())
    print("SUCCESS!")
except Exception as e:
    print("ERROR:", e)

