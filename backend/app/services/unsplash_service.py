import httpx
import os
from dotenv import load_dotenv


load_dotenv()
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

async def get_reference_images(keywords: list):
    if not keywords or not UNSPLASH_ACCESS_KEY:
        search_query = "minimalist graphic design"
    else:
        # AI가 준 키워드 중 너무 긴 단어는 버리고 핵심 단어만 추출
        # 예: "FedEx hidden arrow concept" -> "branding"
        raw_query = keywords[0].lower()
        # 금지어(브랜드명) 필터링 - 브랜드명으로 검색하면 사진이 안 나오는 경우가 많음
        forbidden = ["fedex", "mcdonalds", "apple", "logo", "nike","brand","concept"]
        clean_words = [w for w in raw_query.split() if w not in forbidden]
        
        if not clean_words:
            search_query = "modern branding"
        else:
            search_query = clean_words[0] # 가장 핵심 단어 하나만 사용

    url = f"https://api.unsplash.com/search/photos?query={search_query}&per_page=5&client_id={UNSPLASH_ACCESS_KEY}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            data = response.json()
            return [img ['urls']['regular'] for img in data.get('results',[])]
        except Exception as e:
            print(f"Error fetching images from Unsplash: {e}")
            return []
