#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

#define fast_io                       \
    ios_base::sync_with_stdio(false); \
    cin.tie(NULL);                    \
    cout.tie(NULL)

void solve()
{
    int n, totalPrice;
    cin >> n >> totalPrice;

    vector<int> prices(n);
    for (int i = 0; i < n; i++) cin >> prices[i];

    vector<int> pages(n);
    for (int i = 0; i < n; i++) cin >> pages[i];

    // 1D DP array initialized to 0
    // dp[j] stores maximum pages reachable with spent money 'j'
    vector<int> dp(totalPrice + 1, 0);

    for (int i = 0; i < n; i++)
    {
        // Iterate backwards so we don't overwrite states from the current item
        for (int j = totalPrice; j >= prices[i]; j--)
        {
            dp[j] = max(dp[j], dp[j - prices[i]] + pages[i]);
        }
    }

    cout << dp[totalPrice] << '\n';
}

int main()
{
    fast_io;
    solve();
    return 0;
}