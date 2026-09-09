import string

paragraph = "Hello, world! Hello universe."

translator = str.maketrans('', '', string.punctuation)
cleaned_text = paragraph.translate(translator).lower()

word_counts = {}
for word in cleaned_text.split():
    word_counts[word] = word_counts.get(word, 0) + 1

print("Word Frequencies:", word_counts)