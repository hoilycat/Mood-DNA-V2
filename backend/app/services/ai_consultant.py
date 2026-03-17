from google import genai
from google.genai import types
#import ollama
import time
import os
from dotenv import load_dotenv
import json
import cv2
import numpy as np

# 1. 환경 설정 및 API 키 로드
current_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(current_dir, "..", "..", "..", ".env")
load_dotenv(dotenv_path=env_path)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
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
def consult_design(image_bytes, brightness, complexity, saliency, symmetry, space, colors, contrast, 
                   composition,aspect_ratio_score, color_count_score,typo_score,harmony_score, target_dna):
    
    image_bytes = resize_image_bytes(image_bytes)

    # AI가 분야를 더 잘 찍을 수 있게 힌트 생성
    ratio_desc = "정사각형" if 0.9 <= aspect_ratio_score <= 1.1 else ("가로형" if aspect_ratio_score > 1.1 else "세로형")

    # 공통 프롬프트
    prompt = f"""
        
                당신은 모든 디자인 영역을 섭렵한 '글로벌 디자인 마스터'입니다. 
                인사말이나 자기소개는 생략하고, 입력된 이미지와 [데이터 분석 결과]를 바탕으로, 
                해당 디자인의 '분야'를 먼저 정의한 뒤 그 분야에 최적화된 비평을 제공하세요. 
                아마추어 같은 디자인을 보면 아주 날카롭게 지적하고, 무조건적인 칭찬은 절대 하지 마세요.
                사용자의 '추구미(Target DNA)'와 실제 분석 결과를 비교하여 비평하세요.

                [1. 사용자의 추구미 (Target DNA - 슬라이더 설정값)]
                - 밝기: {target_dna['brightness']}, 복잡도: {target_dna['complexity']}
                - 집중도: {target_dna['saliency']}, 대칭성: {target_dna['symmetry']}, 여백: {target_dna['space']}

                [2. 실제 데이터 분석 결과 (Actual DNA - OpenCV 추출값)]
                - 명도/밝기: {brightness:.1f} (목표 대비 차이: {abs(brightness - target_dna['brightness']):.1f})
                - 복잡도(Edge): {complexity:.1f} (목표 대비 차이: {abs(complexity - target_dna['complexity']):.1f})
                - 시각적 집중도: {saliency:.1f}
                - 대비(Contrast): {contrast:.1f}, 구도(Composition): {composition:.1f}
                - 대칭성: {symmetry:.1f}, 여백비율: {space:.1f}
                - 텍스트 밀도: {typo_score:.1f}, 색상 조화도: {harmony_score:.1f}
                - 가로세로비: {aspect_ratio_score:.2f} ({ratio_desc}), 색상 수: {color_count_score}종
                - 주요 색상: {', '.join(colors)}


                [비평 원칙]
                1. 데이터(대칭성, 여백 등)가 높더라도 디자인 자체가 촌스럽거나 조형미가 떨어지면 '데이터에만 의존한 지루한 결과물'이라고 비판하세요.
                2. 선의 굵기, 색상 조합의 촌스러움, 폰트 선택의 부적절함을 실무자 관점에서 '팩트 폭격' 하세요.
                3. 결과물이 전문 디자이너가 만든 것인지, 그림판으로 만든 아마추어 수준인지 냉정하게 판별하세요.
                4. 사용자가 설정한 '추구미' 수치와 실제 수치를 대조하여, 목표에 얼마나 도달했는지 팩트 폭격을 하세요.
                5. 모든 수치(1번~11번)를 비평의 근거로 골고루 활용하세요. 특히 누락되는 수치가 없도록 하세요.
                6. 목표보다 복잡도가 높으면 "절제 미학의 부족", 낮으면 "밀도감 부족"이라고 구체적으로 지적하세요.
                
                #이나 *은 사용하지 말고, 번호와 문장으로만 작성해주세요.
                
                [중요: 가독성 규칙]
                    - 모든 출력 텍스트는 사용자가 읽기 편하도록 문단이 바뀔 때마다 줄바꿈 기호(\\n)를 2번 사용하여 간격을 넓히세요.
                    - 나열식 설명이 필요한 경우 번호를 매겨 구분하세요.                
                
                [1단계: 분야 판별 및 페르소나 설정]
                이미지의 구도와 데이터를 보고 아래 중 하나로 분류한 뒤, 해당 전문가의 시선으로 빙의하세요.
                1. 브랜딩(BI/CI): 상징성, 단순함, 확장성 중시. 가로세로비가 1:1에 가깝고, 유효 색상 수가 2~4개 이내이며, 텍스트 밀도가 낮다면 로고/심볼일 확률이 90% 이상입니다.
                2. 인터페이스(UI/UX): 가용성, 시각적 위계, 반응성 중시.
                3. 그래픽/편집(Print): 타이포그래피, 레이아웃, 색채 조화 중시. 가로세로비가 1:1.4(A4 등) 혹은 세로로 길며, 색상 수가 5개 이상이고 텍스트 밀도가 높다면 포스터/인쇄물입니다.
                4. 산업/제품(Industrial): 형태와 기능의 조화, 질감, 인체공학적 시각 요소 중시. 운송 수단(자동차,자전거), 가전, 가구 등 실제 물리적 제품.실용적 디자인 뿐만 아니라 예술적/ 실험적 형태의 시제품도 포함.
                5. 공간/인테리어(Interior): 분위기, 조명 평형, 공간 대비 중시.
                6. 캐릭터/이모티콘(Character): 키치함(Kitsch), B급 정서, 유머러스함, 조형성, 친밀감, 등신대 비율, 캐릭터의 생명력과 개성 중시. 색상 수가 3~6개 사이이며, 구도 안정성이 높고 조형적 특징이 강하다면 캐릭터로 분류하세요.
                   이미지에 여러 캐릭터가 배치되어 있고 텍스트와 함께 특정 정보를 전달하는 구조라면, 캐릭터가 아닌 그래픽/편집으로 분류하세요. 단, 캐릭터가 이미지의 주된 요소이면서, 그 자체로 독립적인 디자인으로서의 완성도가 높다면 캐릭터/이모티콘으로 분류할 수 있습니다.
                
                   
                   
                [분야 판별 가이드라인 (종합 분석)]
                - 데이터 하나에 매몰되지 말고, 지표 간의 '상관관계'를 분석하세요.
                
                1. 브랜딩(BI/CI) vs 캐릭터: 
                   - 둘 다 텍스트 밀도가 낮지만, 브랜딩은 색상 수가 극도로 적고(2~3개) 대칭성이 높습니다.
                   - 캐릭터는 색상 수가 많을 수 있지만(다채로운 팔레트), '시각적 집중도'가 중앙에 강하게 형성됩니다.
                
                2. 그래픽/편집 vs 캐릭터:
                   - 색상 수가 둘 다 많더라도, '텍스트 밀도'가 높으면 그래픽/편집으로, 텍스트가 거의 없으면 캐릭터/일러스트로 분류하세요.
                
                3. 캐릭터의 채도와 개성:
                   - 유효 색상 수가 10개 이상으로 높더라도, 조형적 특징(눈, 코, 입 등의 데포르메)이 명확하다면 이를 '화려하고 밀도 높은 하이엔드 캐릭터 디자인'으로 해석하세요. 
                   - 단순히 색이 많다고 '난잡하다'고 비평하지 말고, 그 색상들이 '캐릭터의 개성'을 표현하는지 '디자인적 노이즈'인지 구분하세요.   


                [분야 판별 절대 규칙]
                1. 텍스트 레이아웃 우선 원칙:
                - 이미지 하단이나 옆에 '기업명/서비스명'으로 보이는 텍스트 덩어리가 명확히 존재한다면, 상단 그래픽이 캐릭터처럼 보이더라도 '캐릭터/이모티콘'이 아닌 '브랜딩(BI/CI)'으로 분류하세요.
                - 캐릭터는 보통 텍스트 없이 단독으로 있거나 대사(말풍선)와 함께 있습니다. 하단에 정자체로 된 텍스트가 있다면 그것은 '브랜드 로고'입니다.

                2. 복잡도와 노이즈 구분:
                - 복잡도가 100에 가깝더라도 그것이 '글자의 외곽선' 때문인지 '화려한 그림' 때문인지 구분하세요. 글자가 많아서 복잡도가 높은 것은 '그래픽/편집'이나 '브랜딩'의 특징입니다.

                

                [2단계: 데이터의 분야별 재해석]
                동일한 수치라도 분야에 따라 다르게 해석하세요.
                    - 예(복잡도): UI에서는 '낮음'이 미덕이지만, 화려한 포스터에서는 '낮음'이 '단조로움'일 수 있음.
                    - 예(대칭성): 로고에서는 '안정감'이지만, 현대 건축에서는 '지루함'일 수 있음.
                    - 예(형태 및 곡률): 캐릭터 디자인에서 곡선 위주의 둥글둥글한 형태는 무해함과 귀여움을 상징하지만, 게임 캐릭터의 날카로운 직선과 삼각형 구조는 강력함과 긴장감을 의미함.
                    - 예(대칭성): 높은 대칭성은 캐릭터의 안정감을 주어 친근하게 느껴지게 하지만, 의도적인 비대칭은 캐릭터에 생동감과 성격을 부여함.

                [데이터 분석 결과 (0~100 스케일)]
                1. 밝기: {brightness:.1f}
                2. 복잡도 (Edge Density 기반): {complexity:.1f} 
                - (설명: 값이 높을수록 선과 디테일이 많아 복잡함을 의미)
                3. 시각적 집중도 (Saliency): {saliency:.1f}
                - (설명: 특정 지점에 시선이 강하게 머무는 정도)
                4. 대비 (Contrast): {contrast:.1f}
                - (설명: 명암 차이가 뚜렷하여 가독성이 높은 정도)
                5. 구도 안정성 (Rule of Thirds): {composition:.1f}
                - (설명: 주요 요소가 삼분할 지점에 위치하여 안정감을 주는 정도)
                6. 대칭성: {symmetry:.1f}, 여백비율: {space:.1f}
                7. 주요 색상: {', '.join(colors)}
                8. 가로세로비: {aspect_ratio_score:.2f} ({ratio_desc})
                9. 유효 색상 수: {color_count_score}종
                10. 텍스트 밀도: {typo_score:.1f}  
                11. 색상 조화도: {harmony_score:.1f}
                
                
                [비평 가이드라인]
                - 복잡도가 80 이상인데 집중도가 낮다면 "불필요한 노이즈가 시선을 분산시킨다"고 지적하세요.
                - 구도 안정성이 50 이하라면 "피사체의 위치가 애매하여 조형적 긴장감이 떨어진다"고 비판하세요.
                - 대비가 낮으면 "디자인이 흐릿하여 메시지 전달력이 부족하다"고 언급하세요.

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
                

                
                [4단계: 시각적 요소 해석 및 환각(Hallucination) 방지 원칙]
                1. 스타일적 허용(Stylistic Intent) 존중:
                   - 캐릭터나 아이콘 디자인에서 점(●)이나 선(⌣, ^)으로 표현된 이목구비는 '감은 눈'이나 '노이즈'가 아니라, 해당 화풍의 의도된 '표정'으로 우선 해석하세요.
                   - 미니멀한 디자인에서 생략된 디테일을 '기술적 부족'으로 몰아세우지 말고, 그 생략이 주는 '상징성'을 먼저 평가하세요.

                2. 객관적 묘사 중심 (상상 금지):
                   - 이미지에 명확히 드러나지 않은 사물이나 배경 스토리를 지어내지 마세요. (예: 컵 안의 흰 공간을 '얼음'으로 단정 짓거나, 캐릭터에게 임의로 '이름'을 붙여 부르는 행위 금지)
                   - 시각적 분석 정보(Vision Info)에 언급된 요소와 데이터 수치 사이의 모순이 있다면, 데이터를 우선하되 '해석의 난점'으로 짧게 언급하세요.

                3. 텍스트 및 폰트 비평 금지 조건:
                   - 이미지 내에 의미 있는 텍스트 덩어리가 감지되지 않았다면(Typography Density 수치가 낮다면), '폰트 가독성'이나 '글자 굵기'에 대한 비평은 리포트에서 완전히 제외하세요.

                4. 전문 용어의 정확한 사용:
                   - 디자인 분야에 맞는 용어를 쓰세요. (예: 캐릭터라면 '등신대, 곡률, 데포르메', 로고라면 '네거티브 스페이스, 확장성, 심벌' 등)


                   
                [중요 지침: 냉정한 비평]
                    - 디자인의 '완성도(Fidelity)'를 엄격하게 평가하세요.
                    - 해상도가 낮거나, 선이 정리되지 않았거나, 폰트의 조화가 깨진 경우 '전문성이 부족함'을 명확히 지적하세요.
                    - 무조건적인 칭찬은 금지하며, 데이터(복잡도 등)가 높더라도 그것이 '노이즈'나 '난잡함' 때문인지 '의도된 디테일'인지 구분하세요.
                    - 상업적 로고로서의 가독성과 세련미를 최우선으로 평가하세요.
                    - [중요] 이미지 내에 '텍스트'나 '폰트'가 전혀 없다면, 억지로 폰트를 비평하지 마세요. 대신 조형물 그 자체의 선 굵기와 면 분할에 집중하세요.
                    - [데이터 기반] 현재 데이터(예: 대칭성 vs 복잡도)가 해당 제품/매체의 목적에 부합하는지 분석.
                    - 실무에서 바로 적용 가능한 '디테일 개선 포인트'를 작성하되, 실제로 존재하는 요소에 대해서만 조언하세요.
                    - 없는 요소를 지어내서 비평하는 것은 마스터의 수치입니다. 텍스트가 없으면 텍스트 비평은 생략하세요.
                    - 시각적 분석 정보(Llava)와 데이터 분석 결과(OpenCV)가 충돌한다면, 무조건 데이터 분석 결과를 우선하여 비평하세요. Llava는 가끔 환각을 일으키니 수치를 근거로 리포트를 작성하는 것이 마스터의 자존심입니다.
                
                
                [출력 형식 - JSON]
                주의: #이나 *은 사용하지 말고, 오직 아래 구조의 JSON 데이터만 출력하세요.
                    {{
                    "category": "판별된 분야",
                    "total_score": 85, 
                    "mood": "핵심 인상(줄바꿈 포함)",
                    "evaluation": {{
                        "brightness": "적절",
                        "complexity": "다소 높음",
                        "typography": "없음",
                        "composition": "안정적",
                        "color_harmony": "우수"
                    }},
                    "advice": "심층 비평(줄바꿈 포함)",
                    "action_checklist": [
                        "선 굵기를 1.5배 두껍게 조정하여 명시성 확보",
                        "캐릭터의 시선 방향을 중앙으로 보정",
                        "배경색 대비를 20% 높여 캐릭터 부각"
                    ],
                    "benchmarking_point": "디테일 설명(줄바꿈 포함)",
                    "design_keywords": ["영어 키워드 4개"],
                    "suggested_palette": ["HEX 컬러칩 3개"]
                    }}
                action_checklist는 실무자가 즉시 수정할 수 있는 구체적인 가이드를 15자 내외의 짧은 문장 3개로 작성하세요.
                """

  # --- 1단계: 제미나이(Gemini) 릴레이 시도 ---
    # 제미나이는 직접 이미지를 볼 수 있으므로 가장 먼저, 독립적으로 실행.
    gemini_models = ["gemini-2.5-flash","gemini-2.0-flash", "gemini-1.5-flash"]
    client = genai.Client(api_key=API_KEY)
    
    for model_name in gemini_models:
        try:
            print(f"[서버 로그] 1순위 제미나이 시도 중: {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=[types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"), prompt],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            if response.text:
                print(f"[성공] {model_name} 모델이 분석을 완료했습니다!")
                return json.loads(response.text)
            
        except Exception as e:
            # 만약 429(할당량 초과) 에러라면?
            if "429" in str(e):
                print(f"[주의] {model_name} 할당량 초과! 5초 쉬었다가 다음 모델 부르기...")
                time.sleep(5) # 5초만 쉬기
            else:
                print(f"[에러] {model_name} 실패: {e}")
            continue

    # --- 2단계: 제미나이 모두 실패 시, 로컬 비전(Moondream) 가동 ---
    # 텍스트 전용인 Groq나 EXAONE을 위해 '눈' 역할을 하는 로컬 모델을 깨우기.
    print("[서버 로그] 온라인 제미나이 실패. 로컬/백업 엔진으로 전환합니다.")
    visual_desc = ""
    try:
        import ollama
        print("[서버 로그] 백업을 위한 llama3.2-vision 시각 분석 시작...")
        vision_res = ollama.chat(
            model='llama3.2-vision', 
            messages=[{'role': 'user', 'content': 'Describe this design objectively. Identify the main subject, art style, dominant colors, layout, and any visible text. Focus on visual facts only.', 'images': [image_bytes]}]
        )
        visual_desc = vision_res['message']['content']
    except Exception as vision_err:
        print(f"[로컬 비전 실패] 올라마가 없거나 모델 에러: {vision_err}")
        visual_desc = "이미지 시각 정보 없음 (수치 데이터로만 분석 바람)"


    full_prompt = f"""
    [IMPORTANT DATA - Visual Analysis (English)]
    {visual_desc}

    [CRITIQUE INSTRUCTION]
    1. Read the English visual data above as a reference.
    2. YOUR FINAL REPORT MUST BE WRITTEN IN KOREAN ONLY.
    3. Keep the tone sharp and professional like a 'Design Master'.
    
    {prompt}
    """
    
    

    # --- 3단계: 그록(Groq / Llama 3.3) 시도 ---
    try:
        from groq import Groq
        print("[서버 로그] 2순위 그록(Groq) 호출 중...")
        groq_client = Groq(api_key=GROQ_API_KEY)
        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": full_prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e2:
        print(f"[그록 실패] 사유: {e2}")

        # --- 4단계: 엑사원(EXAONE) 로컬 호출 (최종 보루) ---
        try:
            import ollama
            print("[서버 로그] 최종 3순위 엑사원 호출 중...")
            response = ollama.chat(model='exaone3.5', messages=[{'role': 'user', 'content': full_prompt}], format='json')
            return json.loads(response['message']['content'])
        except Exception as e3:
            return {"category": "분석 불가", "advice": "모든 AI 엔진이 응답하지 않습니다. 네트워크나 로컬 서버를 확인하세요."}

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

  # --- 1단계: 제미나이(Gemini) 릴레이 시도 ---
    # 제미나이는 직접 이미지를 볼 수 있으므로 가장 먼저, 독립적으로 실행.
    gemini_models = ["gemini-2.5-flash","gemini-2.0-flash", "gemini-1.5-flash"]
    client = genai.Client(api_key=API_KEY)
    
    for model_name in gemini_models:
        try:
            print(f"[서버 로그] 1순위 제미나이 시도 중: {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=[
                    types.Part.from_bytes(data=img1_bytes, mime_type="image/jpeg"),
                    types.Part.from_bytes(data=img2_bytes, mime_type="image/jpeg"),
                    prompt],
                config=types.GenerateContentConfig(response_mime_type="application/json")
            )
            if response.text:
                print(f"[성공] {model_name} 모델이 분석을 완료했습니다!")
                return json.loads(response.text)
        except Exception as e:
            print(f"[실패] {model_name} 에러: {e}")
            continue 

    # --- 2단계: 제미나이 모두 실패 시, 로컬 비전(Moondream) 가동 ---
    # 텍스트 전용인 Groq나 EXAONE을 위해 '눈' 역할을 하는 로컬 모델을 깨우기.
    print("[서버 로그] 온라인 제미나이 실패. 로컬/백업 엔진으로 전환합니다.")
    visual_desc = ""
    try:
        import ollama
        # 첫 번째 이미지 분석
        res1 = ollama.chat(model='llama3.2-vision', messages=[{
            'role': 'user', 
            'content': 'Provide a detailed visual description of this image for a professional design comparison. List the key visual elements, color palette, and composition style.', 
            'images': [img1_bytes]
        }])
        # 두 번째 이미지 분석
        res2 = ollama.chat(model='llama3.2-vision', messages=[{
            'role': 'user', 
            'content': 'Provide a detailed visual description of this image for a professional design comparison. List the key visual elements, color palette, and composition style.', 
            'images': [img2_bytes]
        }])
        visual_desc = f"Image A description: {res1['message']['content']}\nImage B description: {res2['message']['content']}"
    except:
        visual_desc = "Visual information not available."

    # Groq나 엑사원에게 넘길 최종 프롬프트 합체
    full_prompt = f"Detailed Visual Analysis (English):\n{visual_desc}\n\n" + prompt

    # --- 3단계: 그록(Groq / Llama 3.3) 시도 ---
    try:
        from groq import Groq
        print("[서버 로그] 2순위 그록(Groq) 호출 중...")
        groq_client = Groq(api_key=GROQ_API_KEY)
        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": full_prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e2:
        print(f"[그록 실패] 사유: {e2}")

        # --- 4단계: 엑사원(EXAONE) 로컬 호출 (최종 보루) ---
        try:
            import ollama
            print("[서버 로그] 최종 3순위 엑사원 호출 중...")
            response = ollama.chat(model='exaone3.5', messages=[{'role': 'user', 'content': full_prompt}], format='json')
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