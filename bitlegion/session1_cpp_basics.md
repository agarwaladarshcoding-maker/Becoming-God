# Bitlegion CP Club — IIITP
## Session 1: Basics of C++

---

## Index
1. [Data Types](#1-data-types)
2. [Operators](#2-operators)
3. [Conditional Statements](#3-conditional-statements)
4. [Ternary Operator](#4-ternary-operator)
5. [Loops](#5-loops)
6. [Functions](#6-functions)
7. [Recap Checklist](#recap-checklist)

---

## 1. Data Types

| Data Type | Size (typical) | Range / Use | Example |
|---|---|---|---|
| `int` | 4 bytes | ~ -2×10⁹ to 2×10⁹ | `int a = 10;` |
| `long long` | 8 bytes | ~ -9×10¹⁸ to 9×10¹⁸ | `long long a = 10000000000;` |
| `float` | 4 bytes | ~6-7 decimal digits precision | `float pi = 3.14f;` |
| `double` | 8 bytes | ~15-16 decimal digits precision | `double pi = 3.14159265;` |
| `char` | 1 byte | single character | `char c = 'A';` |
| `bool` | 1 byte | `true` / `false` | `bool flag = true;` |
| `string` | varies | sequence of characters | `string s = "hello";` |

**Type Casting**
```cpp
int a = 7;
double b = (double)a; // explicit casting -> b = 7.0
```

**Overflow Example**
```cpp
int x = 2000000000;
int y = x + x;        // overflows! result is wrong
long long z = (long long)x + x; // safe
```

> Rule of thumb: if the answer can exceed ~10⁹, use `long long`.

---

## 2. Operators

### 2.1 Arithmetic Operators
| Operator | Meaning | Example |
|---|---|---|
| `+` | Addition | `5 + 3 = 8` |
| `-` | Subtraction | `5 - 3 = 2` |
| `*` | Multiplication | `5 * 3 = 15` |
| `/` | Division | `5 / 3 = 1` (integer division) |
| `%` | Modulo (remainder) | `5 % 3 = 2` |

### 2.2 Relational Operators
| Operator | Meaning | Example |
|---|---|---|
| `==` | Equal to | `5 == 5 → true` |
| `!=` | Not equal to | `5 != 3 → true` |
| `>` | Greater than | `5 > 3 → true` |
| `<` | Less than | `5 < 3 → false` |
| `>=` | Greater or equal | `5 >= 5 → true` |
| `<=` | Less or equal | `5 <= 4 → false` |

### 2.3 Logical Operators
| Operator | Meaning | Example |
|---|---|---|
| `&&` | Logical AND | `(5>3) && (2>1) → true` |
| `\|\|` | Logical OR | `(5<3) \|\| (2>1) → true` |
| `!` | Logical NOT | `!(5>3) → false` |

### 2.4 Assignment Operators
| Operator | Meaning | Example |
|---|---|---|
| `=` | Assign | `a = 5;` |
| `+=` | Add and assign | `a += 3;` (a = a + 3) |
| `-=` | Subtract and assign | `a -= 3;` |
| `*=` | Multiply and assign | `a *= 3;` |
| `/=` | Divide and assign | `a /= 3;` |

### 2.5 Increment / Decrement
```cpp
int a = 5;
a++;   // post-increment: a becomes 6
++a;   // pre-increment: a becomes 7

int b = 5;
cout << b++; // prints 5, then b becomes 6
cout << ++b; // b becomes 7, then prints 7
```

### 2.6 Bitwise Operators (brief)
| Operator | Meaning | Example |
|---|---|---|
| `&` | Bitwise AND | `5 & 3 = 1` |
| `\|` | Bitwise OR | `5 \| 3 = 7` |
| `^` | Bitwise XOR | `5 ^ 3 = 6` |
| `~` | Bitwise NOT | `~5 = -6` |
| `<<` | Left shift | `5 << 1 = 10` |
| `>>` | Right shift | `5 >> 1 = 2` |

---

## 3. Conditional Statements

### 3.1 if / else if / else
```cpp
int marks = 75;
if (marks >= 90) {
    cout << "Grade A";
} else if (marks >= 75) {
    cout << "Grade B";
} else {
    cout << "Grade C";
}
```

### 3.2 switch statement
```cpp
int day = 3;
switch (day) {
    case 1: cout << "Monday"; break;
    case 2: cout << "Tuesday"; break;
    case 3: cout << "Wednesday"; break;
    default: cout << "Invalid day";
}
```

### 3.3 Nested conditionals
```cpp
int a = 10, b = 20;
if (a > 0) {
    if (b > 0) {
        cout << "Both positive";
    }
}
```

---

## 4. Ternary Operator

**Syntax:** `condition ? value_if_true : value_if_false`

```cpp
int a = 10, b = 20;
int max = (a > b) ? a : b;   // max = 20

// Equivalent if-else:
int max2;
if (a > b) max2 = a;
else max2 = b;
```

### Question
**CF 630A — Again Twenty Five!**
Given an integer `n`, print the last two digits of `5^n`.
🔗 https://codeforces.com/problemset/problem/630/A

**Your Answer / Code:**
```cpp



```

---

## 5. Loops

### 5.1 for loop
```cpp
for (int i = 1; i <= 5; i++) {
    cout << i << " ";
}
// Output: 1 2 3 4 5
```

### 5.2 while loop
```cpp
int i = 1;
while (i <= 5) {
    cout << i << " ";
    i++;
}
```

### 5.3 do-while loop
```cpp
int i = 1;
do {
    cout << i << " ";
    i++;
} while (i <= 5);
```

### 5.4 Difference between for, while, and do-while

| Point | for loop | while loop | do-while loop |
|---|---|---|---|
| Condition check | Before each iteration | Before each iteration | After each iteration |
| Execution if condition is false initially | Never executes | Never executes | Executes at least once |
| Initialization | Part of loop syntax | Done separately, before loop | Done separately, before loop |
| Best used when | Number of iterations is known | Number of iterations is unknown, condition-based | Loop body must run at least once |
| Syntax | `for(init; cond; update)` | `while(cond)` | `do {...} while(cond);` |

### 5.5 break and continue
```cpp
for (int i = 1; i <= 5; i++) {
    if (i == 3) continue; // skip 3
    if (i == 5) break;    // stop at 5
    cout << i << " ";
}
// Output: 1 2 4
```

### Question
**Hottest Day**
A weather station records the temperature for `N` consecutive days. Find the maximum temperature recorded during these `N` days.

**Input:** first line `N`, second line `N` integers (temperatures)
**Output:** the maximum temperature

```
Input:
6
32 18 25 41 29 21

Output:
41
```

**Your Answer / Code:**
```cpp



```

---

## 6. Functions

### 6.1 Basic syntax
```cpp
int add(int a, int b) {   // declaration + definition
    return a + b;
}

int main() {
    int result = add(3, 4); // function call
    cout << result;         // 7
}
```

### 6.2 Pass by value vs pass by reference
```cpp
void byValue(int x) {
    x = x + 1;  // does not affect original variable
}

void byReference(int &x) {
    x = x + 1;  // affects original variable
}
```

### Question
**Elephant**
An elephant is at point `0` on a coordinate line and wants to reach point `x` (`x > 0`). In one step it can move `1, 2, 3, 4,` or `5` positions forward. Find the minimum number of steps needed to reach point `x`.

**Input:** integer `x` (1 ≤ x ≤ 1,000,000)
**Output:** minimum number of steps

```
Input: 5      Output: 1
Input: 12     Output: 3
```

🔗 https://codeforces.com/problemset/problem/1385/A

**Your Answer / Code:**
```cpp



```

---

## Recap Checklist

- [ ] Data types & their sizes, overflow awareness
- [ ] Arithmetic, relational, logical, assignment, and bitwise operators
- [ ] `if-else`, `switch`, nested conditionals
- [ ] Ternary operator
- [ ] `for`, `while`, `do-while`, `break`/`continue`
- [ ] Functions — declaration, definition, parameters, return, pass by value/reference
