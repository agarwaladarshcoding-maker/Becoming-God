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

    // 1. Handle all even cases
    if (n % 2 == 0)
    {
        long long count = 1;
        for (int i = 1; i <= n; i += 2)
        {
            cout << count << ' ' << count << ' ';
            count++;
        }
        cout << '\n';
        return;
    }

    // 2. Handle odd cases where the 27-element pattern fits
    if (n >= 27)
    {
        vector<long long> ans(n, 0);

        // Place the triplet (distances 9, 16, 25)
        ans[0] = 1;
        ans[9] = 1;
        ans[25] = 1;

        // Place the parity-breaker (distance 16)
        ans[10] = 2;
        ans[26] = 2;

        // Fill all remaining zeroes with adjacent pairs (distance 1)
        long long current_val = 3;
        for (int i = 0; i < n; i++)
        {
            if (ans[i] == 0)
            {
                ans[i] = current_val;
                ans[i + 1] = current_val;
                current_val++;
                i++; // Skip the newly paired element
            }
        }

        for (int i = 0; i < n; i++)
        {
            cout << ans[i] << (i == n - 1 ? "" : " ");
        }
        cout << '\n';
        return;
    }

    // 3. Odd cases strictly less than 27 cannot form the triplet
    cout << -1 << '\n';
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