def count_in_range(num_list, min_val, max_val):
    return len([x for x in num_list if min_val <= x <= max_val])

# Example
numbers = [10, 20, 30, 40, 50, 60, 70]
print(count_in_range(numbers, 25, 55))
# Output: 3 (30, 40, 50)