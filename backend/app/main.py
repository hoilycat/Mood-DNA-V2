from app.services.google_search import get_reference_images
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
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
    calculate_saturation_ratio,
    calculate_color_harmony_score,
    calculate_roundness,
    calculate_straightness,
    calculate_smoothness
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
    target_dna: str = Form('{"brightness":50,"complexity":50,"saliency":50,"symmetry":50,"space":50}'),
    brand_context: str = Form(...),
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
    
    
    from app.services.analyzer import analyze_text_with_ocr, get_graphics_only_image
    ocr_result = analyze_text_with_ocr(analyze_bytes) # 글자 텍스트와 좌표 추출
    
    # 글자를 지운 '순수 그래픽 이미지' 생성 (복잡도 분석의 혁명!)
    if ocr_result["has_text"]:
        # 글자가 있다면, 글자를 하얀색으로 덮어버린 이미지를 복잡도 계산에 사용해!
        # 이렇게 해야 폰트 외곽선 때문에 복잡도가 100 나오는 걸 막을 수 있어.
        graphics_only_bytes = get_graphics_only_image(analyze_bytes, ocr_result["raw_results"])
        complexity_score = calculate_complexity(graphics_only_bytes)
    else:
        # 글자가 없으면 그냥 원래 이미지로 계산
        complexity_score = calculate_complexity(analyze_bytes)
    
    #텍스트 데이터 파싱
    target_dict = json.loads(target_dna)
    context_dict = json.loads(brand_context)
    
    # 3. 분석 함수 실행 (배경 제거된 analyze_bytes를 재사용)
    brightness_score = calculate_brightness(analyze_bytes)
    complexity_score = calculate_complexity(analyze_bytes)
    saliency = calculate_saliency(analyze_bytes)
    symmetry = calculate_symmetry(analyze_bytes)
    space = calculate_space_ratio(analyze_bytes)
    
    # 💡 중요: extract_color_dna 내에서 배경 제거를 또 하지 않도록 remove_bg=False로 설정
    colors = extract_color_dna(analyze_bytes, k=10, remove_bg_internally=False)
    contrast_score = calculate_contrast(analyze_bytes)
    composition_score = calculate_composition(analyze_bytes)
    aspect_ratio_score = calculate_aspect_ratio(analyze_bytes)
    color_count_score = calculate_effective_color_count(analyze_bytes)
    typo_score = calculate_typography_ratio(analyze_bytes) 
    saturation_score = calculate_saturation_ratio(analyze_bytes)
    harmony_score = calculate_color_harmony_score(analyze_bytes)
    target_dict = json.loads(target_dna)
    roundness = calculate_roundness(analyze_bytes)
    straightness = calculate_straightness(analyze_bytes)
    smoothness = calculate_smoothness(analyze_bytes)


    # 4. AI 컨설턴트에게 분석 요청
    ai_feedback = consult_design(
        analyze_bytes, brightness_score, complexity_score, 
        saliency, symmetry, space, colors, contrast_score, composition_score, aspect_ratio_score, color_count_score,
        typo_score, harmony_score,saturation_score,roundness, straightness, smoothness,target_dict, context_dict, ocr_result["text_content"]
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
        "saturation_score" : saturation_score,
        "harmony_score" : harmony_score,
        "roundness": roundness, 
        "straightness": straightness, 
        "smoothness": smoothness
    }
    
@app.post("/compare")
async def compare_images(
    file1: UploadFile = File(...),
    file2: UploadFile = File(...),
    target_dna: str = Form('{"brightness":50,"complexity":50,"saliency":50,"symmetry":50,"space":50}'),
    brand_context: str = Form(...)
):
    img1_bytes = await file1.read()
    img2_bytes = await file2.read()

    # 1. 배경 제거 후 수치 분석 (로직 통일)
    a_bytes = remove(img1_bytes)
    b_bytes = remove(img2_bytes)
    
    #텍스트 데이터 파싱
    target_dict = json.loads(target_dna)
    context_dict = json.loads(brand_context)
    
    stats1 = {
        "brightness": calculate_brightness(a_bytes),
        "complexity": calculate_complexity(a_bytes),
        "saliency": calculate_saliency(a_bytes),
        "symmetry": calculate_symmetry(a_bytes),
        "space": calculate_space_ratio(a_bytes),
        "colors": extract_color_dna(a_bytes, remove_bg_internally=False)
    }
    stats2 = {
        "brightness": calculate_brightness(b_bytes),
        "complexity": calculate_complexity(b_bytes),
        "saliency": calculate_saliency(b_bytes),
        "symmetry": calculate_symmetry(b_bytes),
        "space": calculate_space_ratio(b_bytes),
        "colors": extract_color_dna(b_bytes, remove_bg_internally=False)
    }

    # 2. AI 비교 분석
    comparison = compare_designs(img1_bytes, img2_bytes, stats1, stats2,target_dict)

    return {
        "comparison": comparison,
        "stats1": stats1,
        "stats2": stats2
    }
    
@app.post("/analyze-batch")
async def analyze_batch(
    files: List[UploadFile] = File(...),
    target_dna: str = Form(...),
    brand_context: str = Form(...),
    db: Session = Depends(get_db)
):
    target_dict = json.loads(target_dna)
    context_dict = json.loads(brand_context)
    
    batch_results = []

    for file in files:
        # 1. 파일 읽기
        image_bytes = await file.read()
        
        # 2. 분석 (기존 개별 분석 로직 재사용)
        # 우선 속도를 위해 rembg(배경제거)는 선택사항으로 두거나 일단 원본으로 돌려보자
        brightness = calculate_brightness(image_bytes)
        complexity = calculate_complexity(image_bytes)
        saliency = calculate_saliency(image_bytes)
        symmetry = calculate_symmetry(image_bytes)
        space = calculate_space_ratio(image_bytes)
        # ... (나머지 지표들도 동일하게 호출)
        
        # 3. 점수 계산 (일치도)
        # 여기서 간단한 거리 계산 로직을 사용해 순위를 매깁니다.
        actual_stats = {"brightness": brightness, "complexity": complexity, "saliency": saliency, "symmetry": symmetry, "space": space}
        
        # 가중치 거리 계산 (임시)
        score = 100 - (abs(target_dict['complexity'] - complexity) + abs(target_dict['space'] - space)) / 2
        
        batch_results.append({
            "filename": file.filename,
            "score": round(score, 1),
            "stats": actual_stats
        })

    # 4. 점수순 정렬
    sorted_results = sorted(batch_results, key=lambda x: x['score'], reverse=True)

    # 5. AI에게 전체 리포트 요청 (오디션 심사평)
    # 이 부분은 ai_consultant.py에 새로운 함수를 만듦
    from app.services.ai_consultant import consult_batch_audition
    master_report = consult_batch_audition(sorted_results, target_dict, context_dict)

    return {
        "ranking": sorted_results,
        "master_report": master_report
    }
