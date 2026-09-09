s = "Racecar"

clean_s = s.lower().replace(" ", "")
is_palindrome = (clean_s == clean_s[::-1])

print("Is Palindrome:", is_palindrome)