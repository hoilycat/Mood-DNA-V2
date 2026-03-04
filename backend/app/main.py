from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.services.analyzer import calculate_brightness
from app.services.analyzer import get_brightness_description
from app.services.analyzer import extract_color_dna
from app.services.analyzer import calculate_complexity 

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],#모든 곳에서 접속 허용
    allow_methods=["*"],
    allow_headers=["*"] 
)
 
@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    
    # [수정] 여러 분석 함수 실행
    brightness_score = calculate_brightness(image_bytes)
    complexity_score = calculate_complexity(image_bytes) # 복잡도 계산
    colors = extract_color_dna(image_bytes, k=5)
    
    return {
        "brightness": brightness_score, 
        "complexity": complexity_score, # 결과에 추가
        "description": get_brightness_description(brightness_score), 
        "colors": colors
    }