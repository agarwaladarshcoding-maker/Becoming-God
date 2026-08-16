import cv2
filepath = input("Enter the file path: ")
image = cv2.imread(filepath)
if image is not None:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    options = (int)(input("Enter 1 to see the photo and 2 for saving the photo with your desired file name"))
    if options == 1:
        cv2.imshow("Grey scale photo", gray)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
        print("Photo displayed succesfully")
    elif options ==2:
        filename = input("Enter the file name in which you wnat to store it: ")
        cv2.imwrite(filename=filename, img=gray)
        print("File saved succesfully with the name: ", filename)
    else:
        print("wrong options. re run the code")


else:
    print("Image is bot present in that file locatio. Rerun the code")
