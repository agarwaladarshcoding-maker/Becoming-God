text = "hello"
pattern = "helo"

k = len(pattern)
match_found = False
for i in range(len(text) - k + 1):
    window = text[i:i+k]
    mismatches = sum(1 for a, b in zip(window, pattern) if a != b)
    if mismatches <= 1:
        match_found = True
        break

print("Fuzzy Match Found:", match_found)