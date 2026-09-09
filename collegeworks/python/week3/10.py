s = "ADOBECODEBANC"
t = "ABC"

dict_t = {}
for c in t: 
    dict_t[c] = dict_t.get(c, 0) + 1
    
required = len(dict_t)
l, r, formed = 0, 0, 0
window_counts = {}
ans = (float("inf"), None, None)

while r < len(s):
    char = s[r]
    window_counts[char] = window_counts.get(char, 0) + 1
    if char in dict_t and window_counts[char] == dict_t[char]:
        formed += 1
        
    while l <= r and formed == required:
        char = s[l]
        if r - l + 1 < ans[0]:
            ans = (r - l + 1, l, r)
        window_counts[char] -= 1
        if char in dict_t and window_counts[char] < dict_t[char]:
            formed -= 1
        l += 1
    r += 1

min_window = "" if ans[0] == float("inf") else s[ans[1]: ans[2] + 1]
print("Minimum Window Substring:", min_window)