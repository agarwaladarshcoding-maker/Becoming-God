text = "hello world hello"
old = "hello"
new = "hi"

replaced_result = ""
if not old:
    replaced_result = text
else:
    i = 0
    while i < len(text):
        if text[i:i+len(old)] == old:
            replaced_result += new
            i += len(old)
        else:
            replaced_result += text[i]
            i += 1

print("Custom Replace:", replaced_result)