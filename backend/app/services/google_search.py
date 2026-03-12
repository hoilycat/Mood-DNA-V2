import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

# .env 로드
env_path = Path(__file__).resolve().parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SERP_API_KEY = os.getenv("SERP_API_KEY")

async def get_reference_images(keywords: list, category: str):
    print("\n" + "="*50)
    print("[SerpApi] 진짜 구글 이미지 검색 시작")
    
    if not SERP_API_KEY:
        print("[ERROR] SERP_API_KEY가 .env에 없습니다.")
        return []

    # 검색어 조합 (예: "dental clinic logo professional minimalist")
    query = f"{' '.join(keywords)} design"
    print(f"[QUERY] 검색어: {query}")

    url = "https://serpapi.com/search"
    params = {
        "engine": "google_images", # 👈 구글 이미지 엔진 사용
        "q": query,
        "api_key": SERP_API_KEY,
        "num": 12 # 12개 가져오기
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            data = response.json()
            
            # 구글 이미지 결과에서 원본 이미지 주소만 추출
            images = data.get("images_results", [])
            links = [img["original"] for img in images if "thumbnail" in img] [:-9]
            
            print(f"[SUCCESS] {len(links)}개의 실제 로고 레퍼런스를 찾았습니다!")
            print("="*50 + "\n")
            return links

        except Exception as e:
            print(f"[SerpApi Error] 에러 발생: {str(e)}")
            return []