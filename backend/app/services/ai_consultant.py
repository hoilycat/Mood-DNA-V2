import google.generativeai as genai
import os
from dotenv import load_dotenv

# 파일 경로 고정
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, "..", "..","..", ".env")

load_dotenv(dotenv_path=env_path)
API_KEY = os.getenv("GEMINI_API_KEY")

# 📍 글자 깨짐 방지를 위해 영어로만 출력!
if not API_KEY:
    print("[ERROR] API_KEY not found in .env file")
else:
    print(f"[SUCCESS] API_KEY loaded: {API_KEY[:8]}...")

genai.configure(api_key=API_KEY)

def consult_design(brightness, complexity, saliency, symmetry, space, colors):

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
                당신은 20년 경력의 시니어 UI/UX 디자인 비평가입니다. 
                제공된 디자인 DNA 수치를 바탕으로, 단순히 수치를 나열하는 것이 아니라 
                지표 간의 상관관계를 분석하여 깊이 있는 비평을 해주세요.

                [데이터 분석 결과]
                - 밝기: {brightness:.1f}, 복잡도: {complexity:.1f}
                - 시각적 집중도: {saliency:.1f}, 대칭성: {symmetry:.1f}, 여백비율: {space:.1f}
                - 주요 색상: {', '.join(colors)}

                [작성 가이드 - 한국어로 작성]
                1. 핵심 인상 (Mood): 
                전체적인 시각적 분위기를 형용사와 디자인 용어를 섞어 세련된 문장으로 2줄 내외로 작성하세요.
                2. 전략적 조언 (Advice): 
                현재 수치(예: 대칭성 vs 여백)가 사용자 경험에 미치는 영향을 분석하고, 
                실무에서 바로 적용 가능한 '심미적 개선 포인트'와 '구조적 제언'을 3줄 이상의 풍성한 내용으로 작성하세요.
                """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        # 터미널 에러 출력도 영어로!
        print(f"[AI Error] {e}")
        return "Mood: AI 분석에 실패했습니다.\nAdvice: 네트워크 상태를 확인해주세요."