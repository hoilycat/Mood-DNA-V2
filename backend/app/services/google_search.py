import httpx
import os
from dotenv import load_dotenv

load_dotenv()
# .env에서 검색용 키를 가져오기.
GOOGLE_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY")
GOOGLE_SEARCH_CX = os.getenv("GOOGLE_SEARCH_CX")

async def get_reference_images(keywords: list, category: str): # category 매개변수 추가
    if not keywords or not GOOGLE_API_KEY:
        print("[Google Search] 키워드나 API 키가 누락되었습니다.")
        return []
    
    # 1. 단어 정제
    raw_string = " ".join(keywords).lower()
    forbidden = ["fedex", "mcdonalds", "apple", "logo", "nike", "disney", "mega", "coffee"]
    clean_words = [w for w in raw_string.replace(',', ' ').split() if w not in forbidden and len(w) > 1]
    
    if not clean_words:
        clean_words = ["design"]

    # 2. 💡 [핵심] 분야별 맞춤형 검색 서픽스 설정
    # AI가 준 category 문자열에 포함된 단어에 따라 검색 방향을 잡아줍니다.
    category = category.lower()
    if "브랜딩" in category or "bi" in category:
        suffix = "brand identity logo design"
    elif "인터페이스" in category or "ui" in category:
        suffix = "ui ux app interface design"
    elif "그래픽" in category or "편집" in category:
        suffix = "graphic poster layout design"
    elif "산업" in category or "제품" in category:
        suffix = "industrial product design mockup"
    elif "공간" in category or "인테리어" in category:
        suffix = "interior architecture space design"
    elif "캐릭터" in category or "이모티콘" in category:
        suffix = "character mascot illustration design"
    else:
        suffix = "visual design inspiration"

    # 3. 검색어 조합 (앞의 핵심 키워드 2개 + 분야 맞춤 서픽스)
    search_query = f"{' '.join(clean_words[:2])} {suffix}"
    
    # 터미널에 표시
    print(f"\n[Google Search API 호출] -------------------")
    print(f"검색어: {search_query}")
    print(f"----------------------------------------------\n")

    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": search_query,
        "key": GOOGLE_API_KEY,
        "cx": GOOGLE_SEARCH_CX,
        "searchType": "image", # 이미지 검색 모드
        "num": 6,              # 6장 가져오기
        "safe": "active"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            data = response.json()
            items = data.get("items", [])
            # 검색 결과에서 이미지 원본 링크만 뽑아서 리스트로 반환
            return [item["link"] for item in items if "link" in item]
        except Exception as e:
            print(f"[Google Search Error] {e}")
            return []
        
        # [디버깅 코드 추가] 실제로 이미지를 몇 개 가져오는지 터미널에 찍어보기
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            data = response.json()
            items = data.get("items", [])
            
            # 💡 여기 중요! 터미널에 아래 내용이 찍히는지 확인하세요.
            links = [item["link"] for item in items if "link" in item]
            print(f"[Google Search] {len(links)}개의 이미지를 찾았습니다.")
            return links
        except Exception as e:
            print(f"[Google Search Error] {e}")
            return []