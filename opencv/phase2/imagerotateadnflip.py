import cv2 as cv2
image = cv2.imread("/Users/adarshagarwala/Documents/Becoming-God/opencv/phase2/phase2.png")
if image is not None:
    height = image.shape[0]
    width = image.shape[1]
    center= (width//2, height//2)
    angle = 90
    scale = 1.0
    #center - > width//2 , height//2
    #angle - > 
    
    M = cv2.getRotationMatrix2D(center, angle, scale)
    rotatedImage = cv2.warpAffine(image , M, (width, height))
    rotatedImage = cv2.resize(rotatedImage, (height, width))
    flipped_horizontal = cv2.flip(image, 1)
    flipped_veritcal = cv2.flip(image, 0)
    flipped_both = cv2.flip(image,-1)
    cv2.imshow("Flipped Horizontall", flipped_horizontal)
    cv2.imshow("Flippewd Vertical", flipped_veritcal)
    cv2.imshow("both", flipped_both)

    cv2.imshow("Rotated Image", rotatedImage)
    cv2.imshow("og Image", image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

else:
    print("Image not found")