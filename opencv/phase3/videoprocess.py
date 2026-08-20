import cv2 as cv2
#1 external ke liye
#2 for 
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Could not read frame")
    cv2.imshow("Webcam fead", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        #VideoWriter = filename, codec, fps, frameSize
        # filename - file name
        # codec - compredssion format
        # fps = smoothness
        
        cv2.VideoWriter("hello")
        print("Quitting")
        break
cap.release()
cv2.destroyAllWindows()