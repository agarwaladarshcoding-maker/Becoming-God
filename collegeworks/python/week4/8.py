def second_smallest(num_list):
    unique_list = list(set(num_list))
    unique_list.sort()
    return unique_list[1] if len(unique_list) > 1 else None


numbers = [10, 5, 8, 5, 20, 2]
print(second_smallest(numbers))
