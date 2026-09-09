def remove_evens(num_list):
    return [x for x in num_list if x % 2 != 0]


numbers = [1, 2, 3, 4, 5, 6, 7, 8]
print(remove_evens(numbers)) 
