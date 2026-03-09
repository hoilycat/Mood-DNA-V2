import httpx
import os
from dotenv import load_dotenv


load_dotenv()
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")

async def get_reference_images(keywords: list):
    if not keywords or not UNSPLASH_ACCESS_KEY:
        return []
    
    search_query = keywords[0]
    url = f"https://api.unsplash.com/search/photos?query={search_query}&per_page=5&client_id={UNSPLASH_ACCESS_KEY}"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            data = response.json()
            return [img ['urls']['regular'] for img in data.get('results',[])]
        except Exception as e:
            print(f"Error fetching images from Unsplash: {e}")
            return []
