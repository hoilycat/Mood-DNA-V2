from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.services.analyzer import calculate_brightness
from app.services.analyzer import get_brightness_description
from app.services.analyzer import extract_color_dna


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
    score = calculate_brightness(image_bytes)
    description = get_brightness_description(score)
    colors = extract_color_dna(image_bytes, k=5)  # k는 추출할 주요 색상의 수
    
    return{
        "brightness":score, 
        "description": get_brightness_description(score), 
        "colors": colors
        }