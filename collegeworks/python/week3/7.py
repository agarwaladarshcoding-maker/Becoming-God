s = "abcabcbb"

char_map = {}
left = 0
max_len = 0

for right, char in enumerate(s):
    if char in char_map and char_map[char] >= left:
        left = char_map[char] + 1
    char_map[char] = right
    max_len = max(max_len, right - left + 1)

print("Longest Substring Length:", max_len)