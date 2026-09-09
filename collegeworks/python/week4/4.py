import itertools

def get_permutations(lst):
    return list(itertools.permutations(lst))

# Example
print(get_permutations([1, 2, 3]))