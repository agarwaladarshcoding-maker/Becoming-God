def filter_long_words(mystr, n):
    return [word for word in mystr.split() if len(word) > n]

mystr = "The quick brown fox jumps over the lazy dog"
n = 4
print(filter_long_words(mystr, n))
