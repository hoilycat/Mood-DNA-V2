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

def calculate_saliency(image_bytes):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return 0.0
    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    success, map = saliency.computeSaliency(img[:, :, :3] if is_logo_mode else img)
    return min(float(np.mean(map) * 500), 100.0) if success else 0.0

def extract_color_dna(image_bytes, k=16, remove_bg=False):
    img, is_logo_mode = get_image_and_mode(image_bytes)
    if img is None: return []
    pixels = img[img[:, :, 3] > 0][:, :3] if is_logo_mode else img.reshape((-1, 3))
    if len(pixels) < k: return []
    data = np.float32(pixels)
    _, labels, centers = cv2.kmeans(data, k, None, (cv2.TERM_CRITERIA_EPS+10, 10, 1.0), 10, 0)
    counts = np.bincount(labels.flatten())
    total = len(pixels)
    
    candidates = []
    for i in range(len(centers)):
        rgb = centers[i][::-1]
        hsv = cv2.cvtColor(np.uint8([[[centers[i][0], centers[i][1], centers[i][2]]]]), cv2.COLOR_BGR2HSV)[0][0]
        if hsv[2] < 30 or hsv[2] > 250: continue # 너무 어둡거나 밝은 색 제거
        candidates.append({'rgb': rgb, 'hex': f"#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}", 'score': hsv[1] * (counts[i]/total)})
    
    candidates.sort(key=lambda x: x['score'], reverse=True)
    final = []
    for c in candidates:
        if len(final) >= 5: break
        if not any(np.linalg.norm(np.array(c['rgb']) - np.array(f['rgb'])) < 60 for f in final):
            final.append(c)
    return [c['hex'] for c in final]