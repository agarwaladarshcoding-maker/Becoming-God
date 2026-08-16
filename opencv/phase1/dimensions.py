import cv2 
image = cv2.imread("opencv/phase1/phase1.png")
image2 = cv2.imread("opencv/phase1/output.jpg")
if image is not None:
    h , w, c = image.shape
    print(h, w, c)
else:
    print("Image could not be loaded")

h,w, c = image2.shape
print(h, w, c)
