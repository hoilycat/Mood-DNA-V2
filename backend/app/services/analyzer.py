import cv2
import numpy as np
from rembg import remove # 배경 제거 라이브러리

# 1. 밝기 계산 
def calculate_brightness(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return 0.0
    
    brightness = np.mean(img)
    return float(brightness)

# 2. 밝기 설명 (점수에 따른 무드 설명)
def get_brightness_description(score: float):
    if score < 80:
        return "Deep & Heavy: 묵직하고 고급스러운 무드"
    elif score < 150:
        return "Balanced & Neutral: 안정적이고 편안한 무드"
    else:        
        return "Bright & Minimal: 화사하고 깨끗한 미니멀 무드"

# 3. 복잡도 계산 (Canny Edge Detection)
def calculate_complexity(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return 0.0

    # 그레이스케일 변환 (윤곽선 따기 전 필수)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 윤곽선 추출 (Canny 알고리즘)
    edges = cv2.Canny(gray, 100, 200)
    
    # 전체 픽셀 중 윤곽선 픽셀이 차지하는 비율 계산
    total_pixels = edges.size
    edge_pixels = np.count_nonzero(edges)
    
    complexity_score = (edge_pixels / total_pixels) * 100 * 10 # 점수 보정 (보기 좋게)
    return min(float(complexity_score), 100.0) # 최대 100점으로 제한

# 4. [UPDATE] 색상 추출 (배경 제거 후 추출)
def extract_color_dna(image_bytes, k=5, remove_bg=True):
    if remove_bg:
    # 1) 배경 제거 (rembg 사용)
        try:
            # rembg는 input/output이 바이너리 형태
            output_bytes = remove(image_bytes)
            nparr = np.frombuffer(output_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED) # 투명도(Alpha) 포함 로드
        except Exception as e:
            print(f"배경 제거 실패 (원본 사용): {e}")
            img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8),cv2.IMREAD_COLOR)

    else: # 배경 제거 없이 원본 이미지로 색상 추출
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)


    if img is None:
        return []
    
    # 2) 데이터 전처리
    # 투명한 배경이 있다면(채널이 4개라면), 투명하지 않은 픽셀만 골라냄
    if img.shape[2] == 4:
        # Alpha 채널이 0이 아닌(투명하지 않은) 픽셀만 선택
        mask = img[:, :, 3] > 0
        pixels = img[mask]
        if len(pixels) == 0: return []
        data = pixels[:, :3] # Alpha 제외하고 RGB만 가져오기
    else:
        data = img.reshape((-1, 3))

    data = np.float32(data)
  
    # 3) K-means 클러스터링
    if len(data) < k: # 픽셀 수가 k보다 적으면 예외 처리
        k = len(data)
        
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    centers = centers.astype(int)
    
    
    # OpenCV는 BGR, 웹은 RGB이므로 변환 필요 (rembg 결과는 RGB일 수 있으나 안전하게 처리)
    # rembg 결과는 보통 RGB지만 cv2.imdecode하면 BGR이 됨.
    if img.shape[2] == 4:
        # rembg를 거친 경우 BGR로 읽혔을 것이므로 RGB로 변환
        centers_rgb = centers[:, ::-1]
    else:
        # 원본도 BGR
        centers_rgb = centers[:, ::-1]
    
    hex_colors = [
        f"#{r:02x}{g:02x}{b:02x}"
        for(r,g,b) in centers_rgb
    ]
    return hex_colors

# 5. 추가 분석 - 시각적 중요도 (Saliency)
def calculate_saliency(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return 0.0

    # Saliency Map 계산
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    (success, saliencyMap) = saliency.computeSaliency(img)
    
    if success:
        score = np.mean(saliencyMap) * 100 * 5
        return min(float(score), 100.0) # 최대 100점으로 제한  
    return  0.0

# 대칭성 계산 (Symmetry)
def calculate_symmetry(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None: return 0.0

    h, w, _ = img.shape
    half_w = w // 2

    # 1. 왼쪽과 오른쪽 자르기
    left_part = img[:, :half_w]
    right_part = img[:, w - half_w:] # 홀수 너비 대응

    # 2. 오른쪽 부분을 거울처럼 뒤집기
    right_flipped = cv2.flip(right_part, 1)

    # 3. 두 부분의 차이 계산
    diff = cv2.absdiff(left_part, right_flipped)
    mean_diff = np.mean(diff)

    # 4. 차이가 적을수록 대칭점수가 높음 (100점에서 감점하는 방식)
    score = 100 - (mean_diff / 255 * 100 * 2) 
    return max(float(score), 0.0)

# 6. 여백 비율 계산 (Space Ratio)
def calculate_space_ratio(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None: return 0.0

    # 1. 그레이스케일 변환 후 히스토그램으로 가장 많이 등장하는 배경색 찾기
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. 배경이라고 판단되는 밝기 범위 (보통 아주 밝거나 아주 어두움)
    # 여기서는 단순화해서 240 이상의 밝은 영역을 여백으로 간주한다.
    _, white_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY)
    
    # 3. 전체 면적 대비 여백 면적 비율 계산
    total_pixels = gray.size
    white_pixels = np.count_nonzero(white_mask)
    
    ratio = (white_pixels / total_pixels) * 100
    return float(ratio)