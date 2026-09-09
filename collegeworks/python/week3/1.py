text = input("Enter the string")
shift = (int)(input("Enter the shift"))
encrypt = True

actual_shift = shift if encrypt else -shift
cipher_result = ""
for char in text:
    if char.isalpha():
        base = ord('A') if char.isupper() else ord('a')
        cipher_result += chr((ord(char) - base + actual_shift) % 26 + base)
    else:
        cipher_result += char

print("Caesar Cipher:", cipher_result)