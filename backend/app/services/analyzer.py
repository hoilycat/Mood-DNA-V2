import cv2
import numpy as np

def calculate_brightness(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)#바이트를 숫자로 바꾸기
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR) #이미지로 바꾸기
    brightness = np.mean(img)#이미지의 밝기 계산
    
    if img is None:
        return 0.0
    
    brightness = np.mean(img)
    return float(brightness)

def get_brightness_description(score: float) :
    if score < 80:
        return "Deep & Heavy: 묵직하고 고급스러운 무드"
    elif score < 150:
        return "Balanced & Neutral: 안정적이고 편안한 무드"
    else:        
        return "Bright & Minimal: 화사하고 깨끗한 미니멀 무드"
    
def extract_color_dna(image_bytes, k=5):
    #이미지 로드
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        return []
    
    #데이터 변환
    data = img.reshape((-1, 3))
    data = np.float32(data)
  
    #K-means 클러스터링 
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    
    #K-means 실행
    _, labels, centers = cv2.kmeans(data, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
    
    #BGR에서 RGB로 변환
    centers = centers.astype(int)
    centers_rgb = centers[:, :: -1]
    
    #Hex 코드로 변환
    hex_colors = [
        f"{r:02x}{g:02x}{b:02x}"
        for(r,g,b) in centers_rgb
    ]
    return hex_colors