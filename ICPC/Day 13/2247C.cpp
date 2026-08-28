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
    vector<long long> s(n);
    vector<long long> t(n);
    for (int i = 0; i < n; i++)
    {
        cin >> s[i];
    }
    for (int i = 0; i < n; i++)
    {
        cin >> t[i];
    }
    long long ans = 0;
    
    // runningSum[i] stores {count_of_zeros, count_of_ones} for prefix of length i
    vector<pair<long long, long long>> runningSum(n + 1);
    runningSum[0] = {0, 0};
    for (int i = 0; i < n; i++)
    {
        if (s[i] == 1)
        {
            runningSum[i + 1] = {
                runningSum[i].first,
                runningSum[i].second + 1};
        }
        else
        {
            runningSum[i + 1] = {
                runningSum[i].first + 1,
                runningSum[i].second};
        }
    }
    
    long long tweakCount = 0;
    
    for (int i = n - 1; i >= 0; i--)
    {
        // Adjust the current bit based on how many times the suffix has been flipped
        long long current_s = s[i];
        if (tweakCount % 2 != 0)
        {
            current_s = 1 - current_s;
        }

        if (current_s == t[i])
        {
            continue;
        }
        
        // We need to flip the prefix up to `i` (length = i + 1)
        // Get the current counts of 0s and 1s in this prefix
        auto [orig_zeros, orig_ones] = runningSum[i + 1];
        long long current_zeros = orig_zeros;
        long long current_ones = orig_ones;
        
        if (tweakCount % 2 != 0)
        {
            current_zeros = orig_ones;
            current_ones = orig_zeros;
        }

        // To flip it in 1 operation, the number of 1s in the prefix must be odd
        if (current_ones % 2 != 0)
        {
            ans++;
            tweakCount++;
        }
        else
        {
            // If the number of 1s is even, we need 2 operations
            // This is only possible if the total length (or zeroCount) allows an auxiliary flip
            if (current_zeros % 2 != 0)
            {
                ans += 2;
                tweakCount += 2;
            }
            else
            {
                cout << -1 << '\n';
                return;
            }
        }
    }
    cout << ans << '\n';
}

int main()
{
    fast_io;
    int tc;
    cin >> tc;
    while (tc--)
    {
        solve();
    }
    return 0;
}