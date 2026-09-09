def list_to_single_int(num_list):
    return int("".join(str(i) for i in num_list))

numbers = [11, 33, 50]
print(list_to_single_int(numbers))
