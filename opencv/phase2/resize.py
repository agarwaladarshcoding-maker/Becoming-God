import cv2 as cv2
image = cv2.imread("/Users/adarshagarwala/Documents/Becoming-God/opencv/phase2/phase2.png")
if image is not None:
    cropped = image[0:, 200:]
    cv2.imshow("Original Image", image)
    cv2.imshow("Cropped Image", cropped)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

else:
    print("Image not found")