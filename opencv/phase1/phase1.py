import cv2 
image = cv2.imread("opencv/phase1/phase1.png")

if image is None:
    print("Error: Could not read the image.")
else: 
    cv2.imshow("Window Title", image) # ek window open karga and it will allow you to see the image
    cv2.waitKey(0) # how to much to keep the window for time
    cv2.destroyAllWindows()
    # cv2.imwrite("output.jpg", image)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cv2.imwrite("output.jpg", gray)
