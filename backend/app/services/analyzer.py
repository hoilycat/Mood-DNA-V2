import cv2
import numpy as np
from rembg import remove # 배경 제거 라이브러리

# 1. 밝기 계산 (기존 유지)
def calculate_brightness(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return 0.0
    
    brightness = np.mean(img)
    return float(brightness)

# 2. 밝기 설명 (기존 유지)
def get_brightness_description(score: float):
    if score < 80:
        return "Deep & Heavy: 묵직하고 고급스러운 무드"
    elif score < 150:
        return "Balanced & Neutral: 안정적이고 편안한 무드"
    else:        
        return "Bright & Minimal: 화사하고 깨끗한 미니멀 무드"

# 3. [NEW] 복잡도 계산 (Canny Edge Detection)
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
def extract_color_dna(image_bytes, k=5):
    # 1) 배경 제거 (rembg 사용)
    try:
        # rembg는 input/output이 바이너리 형태
        output_bytes = remove(image_bytes)
        nparr = np.frombuffer(output_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED) # 투명도(Alpha) 포함 로드
    except Exception as e:
        print(f"배경 제거 실패 (원본 사용): {e}")
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