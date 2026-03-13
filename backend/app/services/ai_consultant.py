from google import genai
from google.genai import types
import ollama
import os
from dotenv import load_dotenv
import json
import cv2
import numpy as np

# 1. 환경 설정 및 API 키 로드
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, "..", "..", "..", ".env")
load_dotenv(dotenv_path=env_path)

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("[ERROR] API_KEY not found in .env file")
else:
    print(f"[SUCCESS] API_KEY loaded: {API_KEY[:8]}...")

# 2. 이미지 리사이즈 함수
def resize_image_bytes(image_bytes, max_size=1024):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None: 
            return image_bytes
            
        h, w = img.shape[:2]
        if max(h, w) > max_size:
            scale = max_size / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            
        _, encoded_img = cv2.imencode('.jpeg', img)
        return encoded_img.tobytes()
    except Exception as e:
        print(f"[Resize Error] {e}")
        return image_bytes

# 3. 단일 디자인 분석 (하이브리드 모드)
def consult_design(image_bytes, brightness, complexity, saliency, symmetry, space, colors):
    image_bytes = resize_image_bytes(image_bytes)

    # 공통 프롬프트
    prompt = f"""
        
                당신은 모든 디자인 영역을 섭렵한 '글로벌 디자인 마스터'입니다. 
                인사말이나 자기소개는 생략하고, 입력된 이미지와 [데이터 분석 결과]를 바탕으로, 
                해당 디자인의 '분야'를 먼저 정의한 뒤 그 분야에 최적화된 비평을 제공하세요. 
                아마추어 같은 디자인을 보면 아주 날카롭게 지적하고, 무조건적인 칭찬은 절대 하지 마세요.
                
                [비평 원칙]
                1. 데이터(대칭성, 여백 등)가 높더라도 디자인 자체가 촌스럽거나 조형미가 떨어지면 '데이터에만 의존한 지루한 결과물'이라고 비판하세요.
                2. 선의 굵기, 색상 조합의 촌스러움, 폰트 선택의 부적절함을 실무자 관점에서 '팩트 폭격' 하세요.
                3. 결과물이 전문 디자이너가 만든 것인지, 그림판으로 만든 아마추어 수준인지 냉정하게 판별하세요.
                #이나 *은 사용하지 말고, 번호와 문장으로만 작성해주세요.
                
                [중요: 가독성 규칙]
                    - 모든 출력 텍스트는 사용자가 읽기 편하도록 문단이 바뀔 때마다 줄바꿈 기호(\\n)를 2번 사용하여 간격을 넓히세요.
                    - 나열식 설명이 필요한 경우 번호를 매겨 구분하세요.                
                
                [1단계: 분야 판별 및 페르소나 설정]
                이미지의 구도와 데이터를 보고 아래 중 하나로 분류한 뒤, 해당 전문가의 시선으로 빙의하세요.
                1. 브랜딩(BI/CI): 상징성, 단순함, 확장성 중시.
                2. 인터페이스(UI/UX): 가용성, 시각적 위계, 반응성 중시.
                3. 그래픽/편집(Print): 타이포그래피, 레이아웃, 색채 조화 중시.
                4. 산업/제품(Industrial): 형태와 기능의 조화, 질감, 인체공학적 시각 요소 중시. 운송 수단(자동차,자전거), 가전, 가구 등 실제 물리적 제품.실용적 디자인 뿐만 아니라 예술적/ 실험적 형태의 시제품도 포함.
                5. 공간/인테리어(Interior): 분위기, 조명 평형, 공간 대비 중시.
                6. 캐릭터/이모티콘(Character): 키치함(Kitsch), B급 정서, 유머러스함, 조형성, 친밀감, 등신대 비율, 캐릭터의 생명력과 개성 중시.
                
                이미지에 여러 캐릭터가 배치되어 있고 텍스트와 함께 특정 정보를 전달하는 구조라면, 캐릭터가 아닌 그래픽/편집으로 분류하세요. 단, 캐릭터가 이미지의 주된 요소이면서, 그 자체로 독립적인 디자인으로서의 완성도가 높다면 캐릭터/이모티콘으로 분류할 수 있습니다.
                

                [2단계: 데이터의 분야별 재해석]
                동일한 수치라도 분야에 따라 다르게 해석하세요.
                    - 예(복잡도): UI에서는 '낮음'이 미덕이지만, 화려한 포스터에서는 '낮음'이 '단조로움'일 수 있음.
                    - 예(대칭성): 로고에서는 '안정감'이지만, 현대 건축에서는 '지루함'일 수 있음.
                    - 예(형태 및 곡률): 캐릭터 디자인에서 곡선 위주의 둥글둥글한 형태는 무해함과 귀여움을 상징하지만, 게임 캐릭터의 날카로운 직선과 삼각형 구조는 강력함과 긴장감을 의미함.
                    - 예(대칭성): 높은 대칭성은 캐릭터의 안정감을 주어 친근하게 느껴지게 하지만, 의도적인 비대칭은 캐릭터에 생동감과 성격을 부여함.

                [데이터 분석 결과]
                    - 밝기: {brightness:.1f}, 복잡도: {complexity:.1f}
                    - 시각적 집중도: {saliency:.1f}, 대칭성: {symmetry:.1f}, 여백비율: {space:.1f}
                    - 주요 색상: {', '.join(colors)}

                [3단계: 최종 비평 리포트 - 한국어로 작성]
                1. 판별된 디자인 분야: (예: 산업 디자인 - 가전제품)
                2. 핵심 인상 (Mood): 해당 분야의 전문 용어를 사용하여 분위기를 2줄 내외로 묘사.
                3. 분야별 심층 조언 (Expert Advice): 
                    - [프로 수준일 때]: 이 디자인이 왜 성공적인지, 데이터(대칭성/여백 등)가 어떻게 조화를 이루어 품격을 만드는지 미학적으로 분석하세요.
                    - [입문 수준일 때]: 데이터의 불균형을 지적하고, 목적에 부합하도록 수정해야 할 핵심 포인트를 조언하세요.
                    - 현재 데이터(예: 대칭성 vs 복잡도)가 해당 제품/매체의 목적에 부합하는지 분석.
                    - 실무에서 바로 적용 가능한 '디테일 개선 포인트'를 3줄 이상 작성.
                4. (선택 사항) 추가적으로, 해당 디자인이 특정 유명 작품이나 스타일과 유사하다면, 그 작품/스타일과의 비교를 통해 조언을 보강하세요.
                5. (선택 사항) 만약 데이터가 모순적이거나 해석이 어려운 경우, '데이터 해석의 난점'을 짧게 언급하고, 그럼에도 불구하고 도출할 수 있는 인사이트를 제시하세요.
                6. (선택 사항) 마지막으로, 해당 디자인이 현재 트렌드와 어떻게 부합하거나 벗어나는지 간략히 언급하여, 실무자에게 '트렌드 적합성'에 대한 시각을 제공하세요.
                7. (선택 사항) 디자인의 '목적'이 명확하다면, 그 목적에 대한 달성도를 평가하고, 만약 개선이 필요하다면 구체적인 개선 방향을 제시하세요.
                8. (선택 사항) 만약 입력된 데이터가 특정 디자인 원칙(예: 균형, 대비, 강조 등)과 관련이 있다면, 그 원칙에 대한 분석과 조언을 추가하세요.
                9. (선택 사항) 디자인이 특정 문화적 맥락이나 타겟 오디언스와 관련이 있다면, 그 맥락에 대한 분석과 조언을 추가하세요.
                10.캐릭터 특화 조언 가이드 (참고)
                    - 현재 데이터가 캐릭터의 '귀여움'이나 '역동성' 등 설계 목적에 부합하는지 분석.
                    - 캐릭터의 등신대 비율과 눈의 위치 등 조형적 특징이 주는 심리적 효과를 비평에 포함.
                    - 만약 디자인이 '의도된 촌스러움'이나 '키치한 감성'을 지향한다면, 그 맥락에 맞춰 분석과 조언을 제공.
                11.벤치마킹 도약 가이드 (Benchmarking Guide):
                    - 하단에 제시될 레퍼런스 이미지들을 단순히 '유사 사례'가 아닌 '완성도를 한 단계 높이기 위한 목표'로 설정하여 설명하세요.
                    - 레퍼런스의 어떤 디테일(질감, 비례, 레이아웃 등)을 흡수해야 현재 디자인이 '프로급'으로 도약할 수 있는지 핀포인트로 조언하세요.
                
                선택 사항 중 가장 핵심적인 1~3가지를 선택하여, 비평에 포함시키세요.
                
                [중요 지침: 냉정한 비평]
                    - 디자인의 '완성도(Fidelity)'를 엄격하게 평가하세요.
                    - 해상도가 낮거나, 선이 정리되지 않았거나, 폰트의 조화가 깨진 경우 '전문성이 부족함'을 명확히 지적하세요.
                    - 무조건적인 칭찬은 금지하며, 데이터(복잡도 등)가 높더라도 그것이 '노이즈'나 '난잡함' 때문인지 '의도된 디테일'인지 구분하세요.
                    - 상업적 로고로서의 가독성과 세련미를 최우선으로 평가하세요.
                
                
                [출력 형식 - JSON]
                주의: #이나 *은 사용하지 말고, 오직 아래 구조의 JSON 데이터만 출력하세요.
                {{
                "category": "판별된 분야",
                "mood": "작성 가이드를 따른 핵심 인상(줄바꿈 포함)",
                "advice": "전략적 조언과 선택 사항(1~3개)을 통합하여 작성한 심층 비평 내용(줄바꿈 포함)",
                "benchmarking_point": "레퍼런스 이미지들을 통해 얻어야 할 '한 끗 차이'의 디테일 설명(줄바꿈 포함)",
                "design_keywords": [
                    "반드시 영어로 작성. 총 4개의 키워드를 아래 규칙에 맞춰 제공하세요.",
                    "1~2번: 업종 및 대상의 구체적 명칭 (예: 'pharmacy logo', 'bakery branding', 'dog cafe identity')",
                    "3~4번: 지향해야 할 미학적 스타일 (예: 'swiss style', 'bauhaus design', 'modern minimalist', 'playful organic')"
                ],
                "suggested_palette": ["추천 HEX 컬러칩 3개"]
                }}

                """

    # --- 1단계: 제미나이 시도 ---
    try:
        print("\n" + "="*50)
        print("[서버 로그] 1단계: 제미나이(온라인) 호출 시도 중...")
        client = genai.Client(api_key=API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                prompt
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        if response.text:
            print("[성공] 제미나이가 분석을 완료했습니다.")
            return json.loads(response.text)
        else:
            raise ValueError("제미나이 응답이 비어있습니다.")

    except Exception as e:
        print(f"[경고] 제미나이 실패(로컬 엔진 전환): {e}")
        
       # --- 2단계: 로컬 하이브리드 모드 (Llava로 보고 + Exaone으로 비평) ---
        try:
            print("[서버 로그] 2단계-1: Llava 모델이 이미지를 스캔합니다...")
            # 1. Llava에게 이미지 묘사 부탁하기
            vision_res = ollama.chat(
                model='llava',
                messages=[{
                    'role': 'user',
                    'content': '이 디자인 결과물을 보고 무엇인지(로고, 캐릭터, 포스터 등)와 주요 특징을 짧게 한국어로 설명해줘.',
                    'images': [image_bytes] # 여기서 실제 이미지를 던져줍니다!
                }]
            )
            visual_description = vision_res['message']['content']
            print(f"[Llava 분석 완료]: {visual_description[:50]}...")

            # 2. 엑사원에게 비전 분석 내용을 합쳐서 최종 비평 부탁하기
            print("[서버 로그] 2단계-2: 엑사원이 비전 분석 내용을 바탕으로 비평을 작성합니다.")
            
            # 원래 프롬프트 앞에 Llava의 설명을 붙여줍니다.
            final_prompt = f"시각적 분석 정보: {visual_description}\n\n" + prompt

            response = ollama.chat(
                model='exaone3.5',
                messages=[{'role': 'user', 'content': final_prompt}],
                format='json' # 엑사원에게 JSON 형식을 강제함
            )
            return json.loads(response['message']['content'])

        except Exception as e2:
            print(f"[최종 에러] 로컬 엔진 마비: {e2}")
            return {
                "category": "분석 불가",
                "mood": "로컬 엔진(Llava/Exaone) 작동 오류",
                "advice": "Ollama가 실행 중인지, 모델이 설치되었는지 확인하세요.",
                "benchmarking_point": "분석 중단",
                "design_keywords": ["error"],
                "suggested_palette": ["#000000"] 
            }

# 4. 시안 비교 분석 (하이브리드 모드)
def compare_designs(img1_bytes, img2_bytes, stats1, stats2):
    # 공통 프롬프트
    prompt = f"""
        당신은 세계적인 디자인 비평가입니다. 두 개의 디자인 시안(A안, B안)을 비교 분석하여 최적의 선택을 제안하세요.
        [데이터 분석 정보]
        - A안: 밝기 {stats1['brightness']:.1f}, 복잡도 {stats1['complexity']:.1f}
        - B안: 밝기 {stats2['brightness']:.1f}, 복잡도 {stats2['complexity']:.1f}
        
        [출력 형식 - JSON]
        {{
            "winner": "A 또는 B",
            "summary": "총평",
            "detail_comparison": "상세 비교",
            "reasoning": "선택 이유",
            "suggested_action": "개선 제안"
        }}
    """

    # --- 1단계: 제미나이 시도 ---
    try:
        print("[서버 로그] 비교 분석: 제미나이 호출 중...")
        client = genai.Client(api_key=API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(data=img1_bytes, mime_type="image/jpeg"),
                types.Part.from_bytes(data=img2_bytes, mime_type="image/jpeg"),
                prompt
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"[비교 실패] 제미나이 에러로 로컬 엑사원 전환: {e}")
        
        # --- 2단계: 엑사원 시도 ---
        try:
            print("[서버 로그] 비교 분석: 로컬 엑사원 호출 중...")
            response = ollama.chat(
                model='exaone3.5',
                messages=[{'role': 'user', 'content': prompt}],
                format='json'
            )
            return json.loads(response['message']['content'])
        except Exception as e2:
            print(f"[최종 에러] 비교 엔진 마비: {e2}")
            return {
                "winner": "N/A", 
                "summary": "분석 불가", 
                "detail_comparison": str(e2), 
                "reasoning": "N/A", 
                "suggested_action": "N/A"
            }