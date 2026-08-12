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
    long long n;
    cin >> n;
    string s;
    cin >> s;
    string ans = "";
    int i = 0;
    while (i < n)
    {
        if (i + 2 < n && s[i + 2] == '0')
        {
            if (i + 3 < n && s[i + 3] == '0')
            {
               long long digits = s[i] - '0';
                ans += ('a' + (digits - 1));
                i++;
            }
            else
            {
                long long digits = (s[i] - '0') * 10 + (s[i + 1] - '0');
                ans += ('a' + (digits - 1));
                i = i + 3;
            }
        }
        else
        {
            long long digits = s[i] - '0';
            ans += ('a' + (digits - 1));
            i++;
        }
    }
    cout << ans << '\n';
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