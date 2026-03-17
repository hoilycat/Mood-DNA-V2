import cv2
import numpy as np
from rembg import remove

def get_image_and_mode(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    if img is None: return None, None
    # 4채널(BGRA)이면 로고 모드로 판단
    is_logo_mode = (len(img.shape) == 3 and img.shape[2] == 4)
    return img, is_logo_mode

def calculate_brightness(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0

    bgr_img = img[:, :, :3] if is_logo_mode else img

    if is_logo_mode:
        # 투명하지 않은 모든 픽셀을 대상으로 함 (검정색 글자도 브랜드의 일부!)
        mask = img[:, :, 3] > 0
        pixels = bgr_img[mask]
    else:
        pixels = bgr_img.reshape(-1, 3)

    if len(pixels) == 0: return 0.0

    # 지각적 밝기 공식 (Luminance)
    # 변수가 흐릿해지는 걸 막기 위해 필요한 것만 슬라이싱해서 씁니다.
    b_p = pixels[:, 0]
    g_p = pixels[:, 1]
    r_p = pixels[:, 2]
    luma = 0.299 * r_p + 0.587 * g_p + 0.114 * b_p
    
    return float(np.mean(luma))

def calculate_complexity(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    # 로고면 BGRA, 일반이면 BGR을 Gray로 변환
    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY if is_logo_mode else cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    
    if is_logo_mode:
        mask = img[:, :, 3] > 0
        area = np.count_nonzero(mask)
        # 내용물 영역 안에서만 엣지 밀도 계산
        score = (np.count_nonzero(edges & mask) / area) * 1500 if area > 0 else 0.0
    else:
        score = (np.count_nonzero(edges) / edges.size) * 1000
        
    return min(float(score), 100.0)

def calculate_space_ratio(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    if is_logo_mode:
        # 투명한 배경 비율 계산
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

def calculate_saliency(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    success, map_data = saliency.computeSaliency(img[:, :, :3] if is_logo_mode else img)
    return min(float(np.mean(map_data) * 500), 100.0) if success else 0.0

def extract_color_dna(image_bytes, k=5, remove_bg=False):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return []
    
    # 1. 투명하지 않은 픽셀만 추출 (배경색 왜곡 방지)
    pixels = img[img[:, :, 3] > 0][:, :3] if is_logo_mode else img.reshape((-1, 3))
    if len(pixels) < k: return []
    
    data = np.float32(pixels)
    # K-means 클러스터링
    _, labels, centers = cv2.kmeans(data, k, None, (cv2.TERM_CRITERIA_EPS + 10, 10, 1.0), 10, cv2.KMEANS_RANDOM_CENTERS)
    
    counts = np.bincount(labels.flatten())
    total = len(pixels)
    
    candidates = []
    for i in range(len(centers)):
        rgb = centers[i][::-1] # BGR -> RGB
        percentage = counts[i] / total
        
        # 미세 노이즈 제거 (0.5% 미만)
        if percentage < 0.005: continue
        
        # [중요] 채도 가중치(s_weight)를 제거하여 검정/회색도 면적만큼 인정받게 함
        candidates.append({
            'rgb': rgb,
            'hex': f"#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}",
            'score': percentage # 순수하게 면적비율로만 점수 산정
        })
    
    # 점수 순(면적 순) 정렬
    candidates.sort(key=lambda x: x['score'], reverse=True)
    
    final = []
    for c in candidates:
        if len(final) >= 5: break
        # 색상 간 거리가 충분히 먼 것만 채택
        if not any(np.linalg.norm(np.array(c['rgb']) - np.array(f['rgb'])) < 30 for f in final):
            final.append(c)
            
    return [c['hex'] for c in final]

def calculate_contrast(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    gray = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2GRAY)
    
    if is_logo_mode:
        mask = img[:, :, 3] > 0
        contrast = gray[mask].std() if np.count_nonzero(mask) > 0 else 0.0
    else:
        contrast = gray.std()
        
    return min(float(contrast * 0.8), 100.0)

def calculate_composition(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    success, map_data = saliency.computeSaliency(img[:, :, :3] if is_logo_mode else img)
    if not success: return 0.0

    M = cv2.moments((map_data * 255).astype(np.uint8))
    if M["m00"] == 0: return 0.0
    cx, cy = int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"])
    
    h, w = map_data.shape
    points = [(w/3, h/3), (2/3*w, h/3), (w/3, 2/3*h), (2/3*w, 2/3*h)]
    min_dist = min([((cx-px)**2 + (cy-py)**2)**0.5 for px, py in points])
    
    return float(100 - (min_dist / ((w**2 + h**2)**0.5 / 2) * 100))

def calculate_aspect_ratio(image_bytes):
    img, _ = get_image_and_mode(image_bytes)
    if img is None: return 1.0
    h, w = img.shape[:2]
    return round(w / h, 2)

def calculate_effective_color_count(image_bytes, threshold=0.01):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0
    pixels = img[img[:, :, 3] > 0][:, :3] if is_logo_mode else img.reshape((-1, 3))
    if len(pixels) < 100: return 0
    
    data = np.float32(pixels)
    _, labels, _ = cv2.kmeans(data, 12, None, (cv2.TERM_CRITERIA_EPS + 10, 10, 1.0), 10, cv2.KMEANS_RANDOM_CENTERS)
    counts = np.bincount(labels.flatten())
    total = len(pixels)
    return len([c for c in counts if c / total > threshold])

def calculate_typography_ratio(image_bytes):
    img, _ = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    gray = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2GRAY)
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 3))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    text_area = 0
    for cnt in contours:
        _, _, w, h = cv2.boundingRect(cnt)
        if 1.5 < (w/h) < 20: text_area += cv2.contourArea(cnt)
    return min(float((text_area / (img.shape[0] * img.shape[1])) * 500), 100.0)

def calculate_color_harmony_score(image_bytes):
    img, _ = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    hsv = cv2.cvtColor(img[:,:,:3], cv2.COLOR_BGR2HSV)
    h_pixels = hsv[:,:,0].flatten()
    if len(h_pixels) == 0: return 0.0
    return max(0.0, 100 - (np.std(h_pixels) / 90 * 100))