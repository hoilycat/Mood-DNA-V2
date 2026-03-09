from app.services.unsplash_service import get_reference_images
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from app.services.analyzer import calculate_brightness
from app.services.analyzer import get_brightness_description
from app.services.analyzer import extract_color_dna
from app.services.analyzer import calculate_complexity 
from app.services.ai_consultant import consult_design
from app.services.analyzer import calculate_saliency
from app.services.analyzer import calculate_symmetry
from app.services.analyzer import calculate_space_ratio
from .database import engine, Base, get_db
from .models import DesignHistory
from sqlalchemy.orm import Session
from fastapi import Depends
from rembg import remove
import json

from dotenv import load_dotenv


app = FastAPI()
load_dotenv()
Base.metadata.create_all(bind=engine) # 테이블 생성



# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],#모든 곳에서 접속 허용
    allow_methods=["*"],
    allow_headers=["*"] 
)
 
@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)
                        ,remove_bg: bool = Form(True)
                        ,db: Session = Depends(get_db)
):
    image_bytes = await file.read()
    
    analyze_bytes =image_bytes
    if remove_bg:
        try:   
            analyze_bytes = remove(image_bytes)
        except Exception as e:
            print(f"배경 제거 실패:{e}")
    
    #여러 분석 함수 실행
    brightness_score = calculate_brightness(analyze_bytes)
    complexity_score = calculate_complexity(analyze_bytes) # 복잡도 계산
    saliency = calculate_saliency(analyze_bytes) # 시각 집중도
    symmetry = calculate_symmetry(analyze_bytes) # 대칭성
    space = calculate_space_ratio(analyze_bytes) # 여백 비율
     
    colors = extract_color_dna(analyze_bytes, k=5, remove_bg = remove_bg)
    
   # AI 컨설턴트에게 디자인 분석 요청
    ai_feedback = consult_design(analyze_bytes,brightness_score, complexity_score, saliency, symmetry, space, colors)
    reference_images = await get_reference_images(ai_feedback.get("unsplash_keywords",[])) 
    
    description = ai_feedback
    
    # DB에 저장
    new_record = DesignHistory(
        brightness=brightness_score,
        complexity=complexity_score,
        saliency=saliency,
        symmetry=symmetry,
        space=space,
        colors=",".join(colors),
        description=json.dumps(ai_feedback) # JSON 문자열로 저장
    )
    db.add(new_record)
    db.commit()
    

    return {
        **ai_feedback, # AI 피드백의 모든 키-값 쌍을 응답에 포함
        "brightness": brightness_score, 
        "complexity": complexity_score, # 결과에 추가
        "saliency": saliency,
        "symmetry": symmetry,
        "space": space,
        "description": description, 
        "colors": colors,
        "reference_images": reference_images
    }