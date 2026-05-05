from app.services.ai_consultant import compare_designs
import cv2, numpy as np
img1 = cv2.imencode('.jpg', np.ones((100, 100, 3), dtype=np.uint8)*255)[1].tobytes()
img2 = cv2.imencode('.jpg', np.ones((100, 100, 3), dtype=np.uint8)*200)[1].tobytes()

stats1 = {"brightness": 100, "complexity": 10, "saliency": 10, "symmetry": 10, "space": 90, "colors": ["#ffffff"]}
stats2 = {"brightness": 80, "complexity": 15, "saliency": 15, "symmetry": 10, "space": 80, "colors": ["#cccccc"]}
target = {"brightness": 50, "complexity": 50, "saliency": 50, "symmetry": 50, "space": 50}

res = compare_designs(img1, img2, stats1, stats2, target)
print("RES:", res)
