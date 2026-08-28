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
    vector<long long> weights(n + 1);
    for (int i = 1; i <= n; i++)
    {
        weights[i] = i;
    }
    long long target = (n*(n+1))/4;
    vector<vector<long long>> dp(n + 1, vector<long long>(target, INT_MAX));
    for (int i = 0; i <= target; i++)
    {
        dp[0][i] = 1;
    }
    for (int i = 1; i <= target; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            if(i>=j)
            dp[i][j] = dp[i-j][j-1]+ dp[];
        }
    }
    cout<<dp[n][target]<<'\n';
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