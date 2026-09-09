s = "programming"

seen = set()
unique_chars = []
for char in s:
    if char not in seen:
        seen.add(char)
        unique_chars.append(char)
        
result = "".join(unique_chars)
print("No Duplicates:", result)