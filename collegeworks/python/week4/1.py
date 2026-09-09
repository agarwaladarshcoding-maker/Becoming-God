def find_greater_than(num_list, n):
    return [x for x in num_list if x > n]

numbers = [10, 25, 5, 30, 12, 8]
print(find_greater_than(numbers, 15)) 
