s = "aaabbcddd"

compressed = ""
if s:
    count = 1
    for i in range(1, len(s)):
        if s[i] == s[i-1]:
            count += 1
        else:
            compressed += f"{s[i-1]}{count}"
            count = 1
    compressed += f"{s[-1]}{count}"


decompressed = ""
for i in range(0, len(compressed), 2):
    char, cnt = compressed[i], int(compressed[i+1])
    decompressed += char * cnt

print("Compressed:", compressed)
print("Decompressed:", decompressed)