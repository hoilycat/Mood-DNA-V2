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
    print("[SerpApi] 디자인 전문 사이트 타겟 검색 시작")
    
    if not SERP_API_KEY:
        print("[ERROR] SERP_API_KEY가 .env에 없습니다.")
        return []

    # 1. 타겟 사이트 설정 (핀터레스트, 드리블, 비핸스 등)
    target_sites = [
        "pinterest.com",
        "dribbble.com",
        "behance.net"
    ]
    
    # 2. 사이트 연산자 생성 (site:site1 OR site:site2 ...)
    site_query = " OR ".join([f"site:{site}" for site in target_sites])

    # 3. 최종 검색어 조합
    # 예: "bakery logo minimalist (site:pinterest.com OR site:dribbble.com OR site:behance.net)"
    query = f"{' '.join(keywords)} design ({site_query})"
    print(f"[QUERY] 최종 검색어: {query}")

    url = "https://serpapi.com/search"
    params = {
        "engine": "google_images",
        "q": query,
        "api_key": SERP_API_KEY,
        "num": 20 # 더 많은 후보를 가져오기 위해 20개로 상향
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            data = response.json()
            
            images = data.get("images_results", [])
            
            # 원본 이미지 링크 추출
            links = [img["original"] for img in images if "original" in img]
            
            # 너무 많이 반환하면 화면이 복잡하니 상위 10개 정도만 반환
            final_links = links[:10]
            
            print(f"[SUCCESS] 디자인 사이트에서 {len(final_links)}개의 레퍼런스를 찾았습니다!")
            print("="*50 + "\n")
            return final_links

        except Exception as e:
            print(f"[SerpApi Error] 에러 발생: {str(e)}")
            return []