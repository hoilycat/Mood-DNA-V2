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
    if is_logo_mode:
        mask = img[:, :, 3] > 0
        pixels = img[mask][:, :3]
        return float(np.mean(pixels)) if len(pixels) > 0 else 0.0
    return float(np.mean(img))

def get_brightness_description(score: float):
    if score < 80: return "Deep & Heavy: 묵직하고 고급스러운 무드"
    elif score < 150: return "Balanced & Neutral: 안정적이고 편안한 무드"
    else: return "Bright & Minimal: 화사하고 깨끗한 미니멀 무드"


def calculate_complexity(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY if is_logo_mode else cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 100, 200)
    if is_logo_mode:
        mask = img[:, :, 3] > 0
        foreground_area = np.count_nonzero(mask)
        edge_pixels = np.count_nonzero(edges & mask)
        score = (edge_pixels / foreground_area) * 100 * 15 if foreground_area > 0 else 0.0
    else:
        score = (np.count_nonzero(edges) / edges.size) * 100 * 10
   
    return min(float(score), 100.0)

def calculate_space_ratio(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    if is_logo_mode:
        transparent_pixels = np.count_nonzero(img[:, :, 3] == 0)
        return float((transparent_pixels / (img.shape[0] * img.shape[1])) * 100)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, white_mask = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY)
    _, black_mask = cv2.threshold(gray, 20, 255, cv2.THRESH_BINARY_INV)
    return float((np.count_nonzero(white_mask | black_mask) / gray.size) * 100)

def calculate_symmetry(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    h, w = img.shape[:2]
    half_w = w // 2
    left = img[:, :half_w]
    right = cv2.flip(img[:, w - half_w:], 1)
    if is_logo_mode:
        diff = cv2.absdiff(left, right)
        score = 100 - (np.mean(diff) / 255 * 100 * 2)
    else:
        left_gray = cv2.cvtColor(left, cv2.COLOR_BGR2GRAY)
        right_gray = cv2.cvtColor(right, cv2.COLOR_BGR2GRAY)
        diff = abs(np.mean(left_gray) - np.mean(right_gray))
        score = 100 - (diff / 255 * 100 * 5)
    return max(float(score), 0.0)

def calculate_saliency(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    saliency_img = img[:, :, :3] if is_logo_mode else img
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    success, saliencyMap = saliency.computeSaliency(saliency_img)
    if success:
        score = np.mean(saliencyMap) * (500 if is_logo_mode else 300)
        return min(float(score), 100.0)
    return 0.0

def extract_color_dna(image_bytes, k=16, remove_bg=False): # k를 16으로 대폭 늘려 모든 미세 색상 다 추출
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return []
    
    # 1. 배경 제외 픽셀 추출
    pixels = img[img[:, :, 3] > 0][:, :3] if is_logo_mode else img.reshape((-1, 3))
    if len(pixels) < k: return []
    
    data = np.float32(pixels)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    counts = np.bincount(labels.flatten())
    total_pixels = len(pixels)
    
    color_candidates = []
    for i in range(len(centers)):
        rgb = centers[i][::-1]
        hsv = cv2.cvtColor(np.uint8([[[centers[i][0], centers[i][1], centers[i][2]]]]), cv2.COLOR_BGR2HSV)[0][0]
        s, v = hsv[1], hsv[2]
        percentage = counts[i] / total_pixels
        
        # [기초 필터링] 너무 어둡거나 너무 밝은 배경색 제거
        if v < 30 or v > 250: continue
        
        color_candidates.append({
            'rgb': rgb,
            'hex': f"#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}",
            'score': s * percentage # 선명도와 비중의 조화
        })
    
    # 점수 높은 순 정렬
    color_candidates.sort(key=lambda x: x['score'], reverse=True)
    
    final_palette = []
    
    # 💡 [핵심: 색상 중복 제거 로직]
    for candidate in color_candidates:
        if len(final_palette) >= 5: break
        
        # 첫 번째 색상은 무조건 추가
        if not final_palette:
            final_palette.append(candidate)
            continue
        
        # 기존에 뽑힌 색상들과 "색상 차이"가 얼마나 나는지 확인
        is_different = True
        for selected in final_palette:
            # RGB 거리 계산 (Euclidean Distance)
            dist = np.linalg.norm(np.array(candidate['rgb']) - np.array(selected['rgb']))
            # 거리가 60보다 작으면 "너무 비슷한 색(보라색 잔상 등)"으로 보고 버림
            if dist < 60: 
                is_different = False
                break
        
        if is_different:
            final_palette.append(candidate)

    # 최종 HEX값만 추출
    result_hex = [c['hex'] for c in final_palette]

    # 만약 결과가 너무 없으면 비중순으로 강제 복구
    if not result_hex:
        sorted_indices = np.argsort(counts)[::-1]
        return [f"#{int(centers[i][2]):02x}{int(centers[i][1]):02x}{int(centers[i][0]):02x}" for i in sorted_indices[:5]]

    return result_hex