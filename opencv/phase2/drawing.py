import cv2 as cv2
image = cv2.imread("/Users/adarshagarwala/Documents/Becoming-God/opencv/phase2/phase2.png")
if image is not None:
   
    height = image.shape[0]
    width = image.shape[1]
    # lined = cv2.line(image, (0, 0), (width, height), (0,0,255), 10 )
    # rectangled = cv2.rectangle(image,(0,0), (width, height), (255,0,0), 4)
    circled = cv2.circle(image,(width//2,height//2),400 , (255,0,255), 4)
    cv2.imshow("circle", circled)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

else:
    print("Image not found")