import cv2
import numpy as np
from rembg import remove # 배경 제거 라이브러리

def get_image_and_mode(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if img is None: return None, None
    is_logo_mode = (len(img.shape) == 3 and img.shape[2] == 4)
    return img, is_logo_mode

def calculate_brightness(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0

    # 1.4채널(BGRA)이든 3채널(BGR)이든 일단 3채널(BGR)만 추출
    bgr_img = img[:, :, :3] if is_logo_mode else img
    
    # 2. HSV로 변환 (채도 S를 쓰기 위함)
    hsv = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)

    if is_logo_mode:
        # 투명도 마스크 (기본)
        alpha = img[:, :, 3]
        mask = alpha > 0
        
        # 필터 A: 가짜 격자무늬(회색/흰색) 제거
        b, g, r = cv2.split(bgr_img)
        # 연한 회색 격자(#CCCCCC 부근)와 완전 흰색 제거
        is_gray_grid = (b > 200) & (b < 215) & (g > 200) & (g < 215) & (r > 200) & (r < 215)
        is_white_grid = (b > 250) & (g > 250) & (r > 250)
        
        # 필터 B: 채도 필터 (무채색/글자색 제거)
        # 채도(s)가 40보다 큰 '색깔 있는' 픽셀만 골라냄 (검정 글자 탈락!)
        is_colored = s > 40
        
        # 최종 마스크 조합: (투명 아님) AND (격자 아님) AND (색깔 있음)
        final_mask = mask & (~is_gray_grid) & (~is_white_grid) & is_colored
        
        # [예외처리] 만약 필터가 너무 세서 남은 픽셀이 하나도 없다면? 다시 기본 투명 마스크로!
        if np.count_nonzero(final_mask) == 0:
            final_mask = mask
            
        pixels = bgr_img[final_mask]
    else:
        # 일반 이미지는 전체 픽셀 사용
        pixels = bgr_img.reshape(-1, 3)

    if len(pixels) == 0: return 0.0

    # 3. 지각적 밝기 공식 적용 (사람의 눈처럼)
    # $Luminance = 0.299R + 0.587G + 0.114B$
    b_p, g_p, r_p = pixels[:, 0], pixels[:, 1], pixels[:, 2]
    luma = 0.299 * r_p + 0.587 * g_p + 0.114 * b_p
    
    return float(np.mean(luma))

#복잡도
def calculate_complexity(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY if is_logo_mode else cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    if is_logo_mode:
        mask = img[:, :, 3] > 0
        area = np.count_nonzero(mask)
        score = (np.count_nonzero(edges & mask) / area) * 1500 if area > 0 else 0.0
    else:
        score = (np.count_nonzero(edges) / edges.size) * 1000
    return min(float(score), 100.0)

#여백
def calculate_space_ratio(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    if is_logo_mode:
        return float((np.count_nonzero(img[:, :, 3] == 0) / (img.shape[0] * img.shape[1])) * 100)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, white = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY)
    _, black = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY_INV)
    return float((np.count_nonzero(white | black) / gray.size) * 100)

def calculate_symmetry(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    h, w = img.shape[:2]
    half = w // 2
    left, right = img[:, :half], cv2.flip(img[:, w - half:], 1)
    if is_logo_mode:
        score = 100 - (np.mean(cv2.absdiff(left, right)) / 255 * 200)
    else:
        score = 100 - (abs(np.mean(left) - np.mean(right)) / 255 * 500)
    return max(float(score), 0.0)

#현저성
def calculate_saliency(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    success, map = saliency.computeSaliency(img[:, :, :3] if is_logo_mode else img)
    return min(float(np.mean(map) * 500), 100.0) if success else 0.0

def extract_color_dna(image_bytes, k=12, remove_bg=False):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return []
    
    # 배경 제외 픽셀 추출
    pixels = img[img[:, :, 3] > 0][:, :3] if is_logo_mode else img.reshape((-1, 3))
    if len(pixels) < k: return []
    
    data = np.float32(pixels)
    # K-means 클러스터링
    _, labels, centers = cv2.kmeans(data, k, None, (cv2.TERM_CRITERIA_EPS + 10, 10, 1.0), 10, cv2.KMEANS_RANDOM_CENTERS)
    
    counts = np.bincount(labels.flatten())
    total = len(pixels)
    
    candidates = []
    for i in range(len(centers)):
        rgb = centers[i][::-1]
        hsv = cv2.cvtColor(np.uint8([[[centers[i][0], centers[i][1], centers[i][2]]]]), cv2.COLOR_BGR2HSV)[0][0]
        percentage = counts[i] / total
        
        # [필터링 완화] 너무 미세한 노이즈(1% 미만)만 제거하고 검은색/흰색도 포함시킴
        if percentage < 0.01: continue
        
        # [점수 계산] 면적(percentage)이 큰 것을 우선하되, 
        # 채도(s)가 높은 색상에 약간의 가산점을 주어 '칙칙한 테두리색'보다 우선순위를 높임
        s_weight = 1 + (hsv[1] / 255) 
        score = percentage * s_weight
        
        candidates.append({
            'rgb': rgb,
            'hex': f"#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}",
            'score': score
        })
    
    # 점수 순 정렬
    candidates.sort(key=lambda x: x['score'], reverse=True)
    
    final = []
    for c in candidates:
        if len(final) >= 5: break
        # [색상 거리 체크] 이미 뽑힌 색과 RGB 거리가 45 이상 차이 나는 '확연히 다른 색'만 추가
        if not any(np.linalg.norm(np.array(c['rgb']) - np.array(f['rgb'])) < 45 for f in final):
            final.append(c)
            
    return [c['hex'] for c in final]

def calculate_contrast(image_bytes):
    """디자인의 명암 대비(가독성 및 강조도) 분석"""
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    
    # 그레이스케일 변환
    gray = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2GRAY)
    
    if is_logo_mode:
        mask = img[:, :, 3] > 0
        if np.count_nonzero(mask) == 0: return 0.0
        pixels = gray[mask]
        contrast = pixels.std() # 배경 제외 픽셀의 표준편차
    else:
        contrast = gray.std()
        
    # 표준편차 0~128 범위를 0~100 점수로 환산
    return min(float(contrast * 0.8), 100.0)

def calculate_composition(image_bytes):
    """삼분할 구도(Rule of Thirds) 및 시각적 균형 분석"""
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    
    # 1. Saliency Map 추출 
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    success, map = saliency.computeSaliency(img[:, :, :3] if is_logo_mode else img)
    if not success: return 0.0

    # 2. 시선이 가장 집중되는 '무게 중심' 찾기
    M = cv2.moments((map * 255).astype(np.uint8))
    if M["m00"] == 0: return 0.0
    cx = int(M["m10"] / M["m00"])
    cy = int(M["m01"] / M["m00"])
    
    h, w = map.shape
    # 3. 삼분할 지점(4개의 교차점)과의 최소 거리 계산
    points = [(w/3, h/3), (2/3*w, h/3), (w/3, 2/3*h), (2/3*w, 2/3*h)]
    min_dist = min([((cx-px)**2 + (cy-py)**2)**0.5 for px, py in points])
    
    # 4. 점수화 (가까울수록 100점)
    max_dist = (w**2 + h**2)**0.5 / 2
    score = 100 - (min_dist / max_dist * 100)
    return float(score)

def calculate_aspect_ratio(image_bytes):
    """이미지의 가로세로비 계산 (가로/세로)"""
    img, _ = get_image_and_mode(image_bytes)
    if img is None: return 1.0
    h, w = img.shape[:2]
    return round(w / h, 2)

def calculate_effective_color_count(image_bytes, threshold=0.01):
    """의미 있는 면적을 차지하는 유효 색상 수 계산"""
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0
    
    # 배경 제외 픽셀 추출
    pixels = img[img[:, :, 3] > 0][:, :3] if is_logo_mode else img.reshape((-1, 3))
    if len(pixels) < 100: return 0
    
    # K-means를 넉넉히(12개) 돌려서 실제로 얼마나 많은 색이 쓰였는지 확인
    k = 12
    data = np.float32(pixels)
    _, labels, _ = cv2.kmeans(data, k, None, (cv2.TERM_CRITERIA_EPS + 10, 10, 1.0), 10, cv2.KMEANS_RANDOM_CENTERS)
    
    counts = np.bincount(labels.flatten())
    total = len(pixels)
    
    # 전체 면적 중 1%(threshold) 이상을 차지하는 색상만 카운트
    effective_colors = [c for c in counts if c / total > threshold]
    return len(effective_colors)