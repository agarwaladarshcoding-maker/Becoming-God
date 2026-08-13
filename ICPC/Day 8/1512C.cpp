#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <queue>
#include <stack>

using namespace std;

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)

void solve()
{
    long long a, b;
    cin >> a >> b;
    string s;
    cin >> s;
    int n = s.length();
    
    if (a + b != n) {
        cout << -1 << '\n';
        return;
    }
    
    // Count fixed 0s and 1s, subtract from a and b
    for (int i = 0; i < n; i++) {
        if (s[i] == '0') a--;
        else if (s[i] == '1') b--;
    }
    
    // Force palindrome pairs where one side is fixed
    for (int i = 0; i < n / 2; i++) {
        int j = n - 1 - i;
        if (s[i] == '0' && s[j] == '?') {
            s[j] = '0';
            a--;
        } else if (s[i] == '1' && s[j] == '?') {
            s[j] = '1';
            b--;
        } else if (s[i] == '?' && s[j] == '0') {
            s[i] = '0';
            a--;
        } else if (s[i] == '?' && s[j] == '1') {
            s[i] = '1';
            b--;
        }
    }
    
    // Check for impossible palindrome conflicts
    for (int i = 0; i < n / 2; i++) {
        int j = n - 1 - i;
        if (s[i] != s[j]) {
            cout << -1 << '\n';
            return;
        }
    }
    
    if (a < 0 || b < 0) {
        cout << -1 << '\n';
        return;
    }
    
    // Fill remaining paired '?' with 0s
    for (int i = 0; i < n / 2 && a > 0; i++) {
        int j = n - 1 - i;
        if (s[i] == '?' && s[j] == '?') {
            s[i] = s[j] = '0';
            a -= 2;
        }
    }
    
    // Fill remaining paired '?' with 1s
    for (int i = 0; i < n / 2 && b > 0; i++) {
        int j = n - 1 - i;
        if (s[i] == '?' && s[j] == '?') {
            s[i] = s[j] = '1';
            b -= 2;
        }
    }
    
    // Handle middle character if n is odd
    if (n % 2 == 1 && s[n / 2] == '?') {
        if (a > 0) {
            s[n / 2] = '0';
            a--;
        } else if (b > 0) {
            s[n / 2] = '1';
            b--;
        }
    }
    
    // Verify result
    if (a != 0 || b != 0) {
        cout << -1 << '\n';
        return;
    }
    
    cout << s << '\n';
}

int main()
{
    fast_io;
    int t;
    cin >> t;
    while (t--)
    {
        solve();
    }
    return 0;
}