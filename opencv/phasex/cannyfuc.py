from pathlib import Path

import cv2

image_path = Path(__file__).with_name("image.png")
img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
if img is None:
	raise FileNotFoundError(f"Could not read image: {image_path}")
edges = cv2.Canny(img, 50, 150)
cv2.imshow("Original Image", img)
cv2.imshow("Edges", edges)
cv2.waitKey(0)
cv2.destroyAllWindows()