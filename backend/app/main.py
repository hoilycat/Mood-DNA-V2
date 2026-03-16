from app.services.google_search import get_reference_images
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from app.services.analyzer import (
    calculate_brightness, 
    extract_color_dna, 
    calculate_complexity, 
    calculate_saliency, 
    calculate_symmetry, 
    calculate_space_ratio,
    calculate_contrast,
    calculate_composition,
    calculate_aspect_ratio,
    calculate_effective_color_count,
    calculate_typography_ratio,
    calculate_color_harmony_score
)
from app.services.ai_consultant import consult_design, compare_designs
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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"] 
)
 
@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    remove_bg: bool = Form(True),
    db: Session = Depends(get_db)
):
    # 1. 이미지 바이트 읽기
    image_bytes = await file.read()
    
    # 2. 배경 제거 처리 (여기서 딱 한 번만 수행!)
    analyze_bytes = image_bytes
    if remove_bg:
        try:   
            analyze_bytes = remove(image_bytes) # 배경이 제거된 바이트 생성
        except Exception as e:
            print(f"배경 제거 실패: {e}")
    
    # 3. 분석 함수 실행 (배경 제거된 analyze_bytes를 재사용)
    brightness_score = calculate_brightness(analyze_bytes)
    complexity_score = calculate_complexity(analyze_bytes)
    saliency = calculate_saliency(analyze_bytes)
    symmetry = calculate_symmetry(analyze_bytes)
    space = calculate_space_ratio(analyze_bytes)
    
    # 💡 중요: extract_color_dna 내에서 배경 제거를 또 하지 않도록 remove_bg=False로 설정
    colors = extract_color_dna(analyze_bytes, k=5, remove_bg=False)
    contrast_score = calculate_contrast(analyze_bytes)
    composition_score = calculate_composition(analyze_bytes)
    aspect_ratio_score = calculate_aspect_ratio(analyze_bytes)
    color_count_score = calculate_effective_color_count(analyze_bytes)
    typo_score = calculate_typography_ratio(analyze_bytes) 
    harmony_score = calculate_color_harmony_score(analyze_bytes)

    # 4. AI 컨설턴트에게 분석 요청
    ai_feedback = consult_design(
        analyze_bytes, brightness_score, complexity_score, 
        saliency, symmetry, space, colors, contrast_score, composition_score, aspect_ratio_score, color_count_score,
        typo_score,harmony_score
    )
    
    # 5. 구글 검색을 통해 레퍼런스 이미지 가져오기
    # AI가 준 키워드 리스트를 사용하여 검색 (JSON 키값은 ai_consultant.py와 맞춤)
    keywords = ai_feedback.get("design_keywords", [])
    category = ai_feedback.get("category", "") # 카테고리 추출
    reference_images = await get_reference_images(keywords, category) # 매개변수 추가
    
    # 6. DB에 기록 저장
    new_record = DesignHistory(
        brightness=brightness_score,
        complexity=complexity_score,
        saliency=saliency,
        symmetry=symmetry,
        space=space,
        colors=",".join(colors),
        description=json.dumps(ai_feedback, ensure_ascii=False) # 한글 깨짐 방지
    )
    db.add(new_record)
    db.commit()
    
    # 7. 최종 결과 반환
    return {
        **ai_feedback,  # AI 피드백(category, mood, advice, benchmarking_point 등)
        "brightness": brightness_score, 
        "complexity": complexity_score,
        "saliency": saliency,
        "symmetry": symmetry,
        "space": space,
        "colors": colors,
        "contrast": contrast_score,
        "composition": composition_score,
        "reference_images": reference_images,
        "aspect_ratio": aspect_ratio_score,
        "color_count": color_count_score,
        "typo_score" : typo_score, 
        "harmony_score" : harmony_score
    }
    
@app.post("/compare")
async def compare_images(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
):
    img1_bytes = await file1.read()
    img2_bytes = await file2.read()

    # 1. 배경 제거 후 수치 분석 (로직 통일)
    a_bytes = remove(img1_bytes)
    b_bytes = remove(img2_bytes)

    stats1 = {
        "brightness": calculate_brightness(a_bytes),
        "complexity": calculate_complexity(a_bytes),
        "saliency": calculate_saliency(a_bytes),
        "symmetry": calculate_symmetry(a_bytes),
        "space": calculate_space_ratio(a_bytes),
        "colors": extract_color_dna(a_bytes, remove_bg=False)
    }
    stats2 = {
        "brightness": calculate_brightness(b_bytes),
        "complexity": calculate_complexity(b_bytes),
        "saliency": calculate_saliency(b_bytes),
        "symmetry": calculate_symmetry(b_bytes),
        "space": calculate_space_ratio(b_bytes),
        "colors": extract_color_dna(b_bytes, remove_bg=False)
    }

    # 2. AI 비교 분석
    comparison = compare_designs(img1_bytes, img2_bytes, stats1, stats2)

    return {
        "comparison": comparison,
        "stats1": stats1,
        "stats2": stats2
    }
    